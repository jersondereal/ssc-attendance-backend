technologies
- framework: express.js
- database: postgresql
- auth: JWT (credentials, username & password)

cloud database provider
- aiven.io [https://console.aiven.io/account/a532b322544a/project/ssc-attendance/services/ssc/databases]
- account: jersoncaibog704@gmail.com (google)

backend service
- render.com [https://ssc-attendance-backend.onrender.com]
- account: jersoncaibog1@gmail.com

image hosting (student profile photos)
- imgbb [https://imgbb.com] via API, key in .env.local as IMGBB_API_KEY
- account: jersoncaibog1@gmail.com, username jerson23
- uploaded from backend/controllers/uploadController.js, only the returned URL is stored in the students table
- upload expiration is set per student year level (roughly timed to graduation), not permanent
