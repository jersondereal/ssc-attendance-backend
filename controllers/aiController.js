const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const YEARLY_TOKEN_LIMIT = 10_000_000;

async function getYearlyTokensUsed() {
  const year = new Date().getFullYear();
  const { rows } = await db.query(
    `SELECT value FROM settings WHERE category = 'ai' AND key = $1 LIMIT 1`,
    [`tokens_used_${year}`]
  );
  return rows.length ? parseInt(rows[0].value, 10) || 0 : 0;
}

async function addTokensUsed(tokens) {
  if (!tokens || tokens <= 0) return;
  const year = new Date().getFullYear();
  await db.query(
    `INSERT INTO settings (category, key, value, description)
     VALUES ('ai', $1, $2::text, 'Cumulative Gemini tokens used this year')
     ON CONFLICT (category, key)
     DO UPDATE SET value = (COALESCE(settings.value::int, 0) + $2)::text, updated_at = NOW()`,
    [`tokens_used_${year}`, tokens]
  );
}

// Compact schema injected into SQL-generation prompt only
const SCHEMA_CONTEXT = `
users(id int, username varchar, role varchar, last_login timestamptz, created_at timestamptz, updated_at timestamptz)
students(id int, student_id varchar PK, name varchar, college varchar, year varchar, section varchar, rfid varchar, profile_image_url text, created_at timestamptz, updated_at timestamptz)
events(id int, title varchar, event_date date, location varchar, fine decimal, courses jsonb, sections jsonb, school_years jsonb, created_at timestamptz, updated_at timestamptz)
attendance(id int, student_id varchar FK→students.student_id, event_id int FK→events.id, status varchar('Present'|'Absent'|'Excused'), is_paid bool, check_in_time timestamptz, created_at timestamptz, updated_at timestamptz)
colleges(id int, code varchar, name varchar, display_order int, created_at timestamptz, updated_at timestamptz)
settings(id int, category varchar, key varchar, value text, description text, created_at timestamptz, updated_at timestamptz)
`.trim();

const ALLOWED_ROLES = ['administrator', 'moderator'];

const aiController = {
  async chat(req, res) {
    // Role check — only administrator and moderator may use AI chat
    const userRole = req.user?.role?.toLowerCase();
    if (!ALLOWED_ROLES.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    // Cap conversation history to last 6 messages to limit token usage
    const cappedHistory = history.slice(-6);

    // Convert frontend history format to Gemini SDK format
    // Frontend sends: { role: 'user' | 'assistant', parts: string }
    // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
    const geminiHistory = cappedHistory.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(h.parts) }],
    }));

    // --- Yearly token limit check ---
    const tokensUsed = await getYearlyTokensUsed();
    if (tokensUsed >= YEARLY_TOKEN_LIMIT) {
      const year = new Date().getFullYear();
      return res.status(200).json({
        reply: `The AI Assistant is in **free mode** for the rest of ${year} — the yearly usage limit has been reached. It will reset on **January 1, ${year + 1}**.`,
      });
    }

    try {
      // --- Call 1: Generate SQL with thinking enabled ---
      const sqlSystemInstruction =
        `You are a PostgreSQL expert. Use this schema:\n${SCHEMA_CONTEXT}\n\n` +
        'Think carefully about which tables and columns to join before writing the query. ' +
        'Generate a single valid SELECT SQL query that answers the user\'s question. ' +
        'PostgreSQL rules you MUST follow:\n' +
        '1. Every non-aggregate column in SELECT must also appear in GROUP BY.\n' +
        '2. To find "the last event", use a subquery: WHERE event_date = (SELECT MAX(event_date) FROM events) or filter by the highest id.\n' +
        '3. Use CTEs (WITH clauses) for multi-step logic to keep the query correct.\n' +
        '4. Never use exact equality (=) when filtering text fields like college, name, or title based on user input. Always use ILIKE with a wildcard: e.g. college ILIKE \'%engineering%\'.\n' +
        '5. If the question involves attendance counts, always JOIN attendance with students and/or events as needed.\n' +
        '6. Always SELECT enough context columns to make the answer meaningful. For example: if answering about an event, include event title AND event_date AND location. If answering about a student, include name AND college AND year. If answering about counts, include the count AND the label it belongs to.\n' +
        'Return ONLY the raw SQL — no explanation, no markdown, no extra text. Your entire response must be a valid SQL query starting with SELECT.';

      const sqlModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: sqlSystemInstruction,
      });

      const extractSql = (text) => {
        const fence = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
        if (fence) return fence[1].trim();
        // Prefer WITH (CTE) over SELECT so the full query is preserved
        const withIdx = text.search(/\bWITH\b/i);
        const selectIdx = text.search(/\bSELECT\b/i);
        if (withIdx !== -1 && (selectIdx === -1 || withIdx < selectIdx)) {
          return text.slice(withIdx).trim();
        }
        return selectIdx !== -1 ? text.slice(selectIdx).trim() : text.trim();
      };

      const isValidSql = (sql) =>
        /^(SELECT|WITH)\b/i.test(sql) &&
        !/\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i.test(sql);

      // Up to 2 attempts — retry once with an explicit nudge if first attempt fails
      let sqlResult, rawSql;
      const sqlChat = sqlModel.startChat({ history: geminiHistory });
      for (let attempt = 1; attempt <= 2; attempt++) {
        const prompt = attempt === 1
          ? message.trim()
          : `${message.trim()}\n\nIMPORTANT: Your previous response was not valid SQL. You MUST respond with only a raw SELECT statement and nothing else.`;
        sqlResult = await sqlChat.sendMessage(prompt);
        rawSql = extractSql(sqlResult.response.text().trim());
        if (isValidSql(rawSql)) break;
        if (attempt === 2) {
          return res.status(200).json({
            reply: "I wasn't able to generate a valid query for that question. Please try rephrasing it.",
          });
        }
      }

      // Belt-and-suspenders DML check
      if (/\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i.test(rawSql)) {
        return res.status(200).json({ reply: 'Only read-only queries are permitted.' });
      }

      // --- Execute query ---
      let queryResult;
      try {
        queryResult = await db.query(rawSql);
      } catch (dbErr) {
        console.error('AI query execution error:', dbErr.message);
        console.error('Failed SQL:\n', rawSql);
        return res.status(200).json({
          reply: "I generated a query but it failed to execute. Please try rephrasing your question or ask something else.",
        });
      }

      const totalRows = queryResult.rows.length;
      // Cap result at 100 rows before passing to Gemini
      const rows = queryResult.rows.slice(0, 100);
      const overflowNote = totalRows > 100 ? `\n(Note: ${totalRows} total rows found; showing first 100.)` : '';
      const resultPayload = `${JSON.stringify(rows)}${overflowNote}`;

      // --- Call 2: Format result into natural language (no schema re-injection) ---
      const formatModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction:
          'You are a helpful data analyst. Format the provided query result into a clear, concise natural language response. ' +
          'Formatting rules:\n' +
          '- Use a markdown table when showing multiple records with the same fields.\n' +
          '- Use a tight bullet list (no blank lines between items) only for short property lists of a single record.\n' +
          '- Never add blank lines between bullet list items.\n' +
          '- Keep responses concise — do not repeat the question or add unnecessary preamble.\n' +
          '- This system is based in the Philippines — always use PHP (₱) for monetary values, never USD or $.\n' +
          '- If the query result is an empty array, say "No records found." — never say the data does not exist or imply the system has no such data.\n' +
          '- If a result contains an image URL (e.g. profile_image_url), render it as a markdown image: ![image](url).',
      });

      const formatResult = await formatModel.generateContent(
        `User question: ${message.trim()}\n\nQuery result (JSON):\n${resultPayload}`
      );
      const reply = formatResult.response.text().trim();

      // --- Record token usage ---
      const tokensThisRequest =
        (sqlResult.response.usageMetadata?.totalTokenCount ?? 0) +
        (formatResult.response.usageMetadata?.totalTokenCount ?? 0);
      addTokensUsed(tokensThisRequest).catch((e) => console.error('Token tracking error:', e));

      return res.json({ reply });
    } catch (error) {
      // Handle Gemini rate limit (free tier quota exceeded)
      if (error?.status === 429) {
        // Calculate seconds remaining until midnight Pacific Time
        const now = new Date();
        const pacificParts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).formatToParts(now);
        const p = {};
        pacificParts.forEach(part => { if (part.type !== 'literal') p[part.type] = parseInt(part.value); });
        const secsIntoDay = p.hour * 3600 + p.minute * 60 + p.second;
        const secsUntilReset = 86400 - secsIntoDay;

        // Format reset time in Philippine Time (UTC+8)
        const resetDate = new Date(now.getTime() + secsUntilReset * 1000);
        const phtTime = new Intl.DateTimeFormat('en-PH', {
          timeZone: 'Asia/Manila',
          hour: 'numeric', minute: '2-digit', hour12: true,
        }).format(resetDate);

        // Format time remaining
        const hrs = Math.floor(secsUntilReset / 3600);
        const mins = Math.floor((secsUntilReset % 3600) / 60);
        const timeLeft = hrs > 0 ? `${hrs} hour${hrs !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}` : `${mins} minute${mins !== 1 ? 's' : ''}`;

        return res.status(200).json({
          reply: `Daily request limit reached. Resets at **${phtTime} PHT** (${timeLeft} from now).`,
        });
      }
      console.error('AI chat error:', error);
      if (error?.status === 503) {
        return res.status(200).json({ reply: 'The AI model is currently overloaded with requests. Please try again in a moment.' });
      }
      if (error?.status === 500) {
        return res.status(200).json({ reply: 'The AI service encountered an internal error. Please try again.' });
      }
      const detail = error?.message ? ` (${error.message.split('\n')[0]})` : '';
      return res.status(500).json({ message: `An error occurred while processing your request.${detail}` });
    }
  },
};

module.exports = aiController;
