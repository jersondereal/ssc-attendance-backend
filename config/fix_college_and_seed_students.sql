-- Fix college/course column values and add 100 more students
-- Run after migrate_course_to_college.sql so the column is named "college".
-- If your column is still named "course", use the commented UPDATE below instead.

-- 1. Fix invalid college values (e.g. "courses", "course", or typos) to valid codes (bsit, bshm, bscrim)
UPDATE students
SET college = CASE
    WHEN LOWER(TRIM(college)) IN ('bsit', 'bshm', 'bscrim') THEN LOWER(TRIM(college))
    ELSE 'bsit'
END;

-- If column is still "course" (before migration), run this instead of the UPDATE above:
-- UPDATE students SET course = CASE WHEN LOWER(TRIM(course)) IN ('bsit','bshm','bscrim') THEN LOWER(TRIM(course)) ELSE 'bsit' END;

-- 2. Insert 100 more students (24-0001 through 24-0100)
INSERT INTO students (student_id, name, college, year, section, rfid)
VALUES
    ('24-0001', 'Alex Rivera', 'bsit', '1', 'a', '3000000001'),
    ('24-0002', 'Bianca Cruz', 'bshm', '1', 'a', '3000000002'),
    ('24-0003', 'Carlos Mendoza', 'bscrim', '1', 'a', '3000000003'),
    ('24-0004', 'Diana Reyes', 'bsit', '1', 'b', '3000000004'),
    ('24-0005', 'Eduardo Santos', 'bshm', '1', 'b', '3000000005'),
    ('24-0006', 'Fatima Lopez', 'bscrim', '1', 'b', '3000000006'),
    ('24-0007', 'Gabriel Torres', 'bsit', '1', 'c', '3000000007'),
    ('24-0008', 'Hannah Morales', 'bshm', '1', 'c', '3000000008'),
    ('24-0009', 'Ian Fernandez', 'bscrim', '1', 'c', '3000000009'),
    ('24-0010', 'Julia Ramos', 'bsit', '1', 'd', '3000000010'),
    ('24-0011', 'Kevin Gutierrez', 'bshm', '2', 'a', '3000000011'),
    ('24-0012', 'Laura Herrera', 'bscrim', '2', 'a', '3000000012'),
    ('24-0013', 'Marcus Diaz', 'bsit', '2', 'a', '3000000013'),
    ('24-0014', 'Nina Vega', 'bshm', '2', 'b', '3000000014'),
    ('24-0015', 'Oscar Castillo', 'bscrim', '2', 'b', '3000000015'),
    ('24-0016', 'Paula Ortiz', 'bsit', '2', 'b', '3000000016'),
    ('24-0017', 'Quinn Jimenez', 'bshm', '2', 'c', '3000000017'),
    ('24-0018', 'Rachel Moreno', 'bscrim', '2', 'c', '3000000018'),
    ('24-0019', 'Samuel Ruiz', 'bsit', '2', 'c', '3000000019'),
    ('24-0020', 'Tina Alvarez', 'bshm', '2', 'd', '3000000020'),
    ('24-0021', 'Uma Chavez', 'bscrim', '2', 'd', '3000000021'),
    ('24-0022', 'Victor Dominguez', 'bsit', '2', 'd', '3000000022'),
    ('24-0023', 'Wendy Silva', 'bshm', '3', 'a', '3000000023'),
    ('24-0024', 'Xavier Castro', 'bscrim', '3', 'a', '3000000024'),
    ('24-0025', 'Yolanda Romero', 'bsit', '3', 'a', '3000000025'),
    ('24-0026', 'Zachary Sandoval', 'bshm', '3', 'b', '3000000026'),
    ('24-0027', 'Amy Fuentes', 'bscrim', '3', 'b', '3000000027'),
    ('24-0028', 'Brandon Rios', 'bsit', '3', 'b', '3000000028'),
    ('24-0029', 'Claire Delgado', 'bshm', '3', 'c', '3000000029'),
    ('24-0030', 'Daniel Acosta', 'bscrim', '3', 'c', '3000000030'),
    ('24-0031', 'Elena Contreras', 'bsit', '3', 'c', '3000000031'),
    ('24-0032', 'Felix Nunez', 'bshm', '3', 'd', '3000000032'),
    ('24-0033', 'Grace Valdez', 'bscrim', '3', 'd', '3000000033'),
    ('24-0034', 'Henry Espinoza', 'bsit', '3', 'd', '3000000034'),
    ('24-0035', 'Ivy Maldonado', 'bshm', '4', 'a', '3000000035'),
    ('24-0036', 'Jack Aguilar', 'bscrim', '4', 'a', '3000000036'),
    ('24-0037', 'Kate Figueroa', 'bsit', '4', 'a', '3000000037'),
    ('24-0038', 'Leo Mejia', 'bshm', '4', 'b', '3000000038'),
    ('24-0039', 'Mia Solis', 'bscrim', '4', 'b', '3000000039'),
    ('24-0040', 'Nathan Luna', 'bsit', '4', 'b', '3000000040'),
    ('24-0041', 'Olivia Pena', 'bshm', '4', 'c', '3000000041'),
    ('24-0042', 'Peter Cabrera', 'bscrim', '4', 'c', '3000000042'),
    ('24-0043', 'Quinn Salazar', 'bsit', '4', 'c', '3000000043'),
    ('24-0044', 'Rosa Duran', 'bshm', '4', 'd', '3000000044'),
    ('24-0045', 'Simon Navarro', 'bscrim', '4', 'd', '3000000045'),
    ('24-0046', 'Tara Serrano', 'bsit', '1', 'a', '3000000046'),
    ('24-0047', 'Uriah Marquez', 'bshm', '1', 'b', '3000000047'),
    ('24-0048', 'Vera Cortez', 'bscrim', '1', 'c', '3000000048'),
    ('24-0049', 'Wyatt Leyva', 'bsit', '1', 'd', '3000000049'),
    ('24-0050', 'Xena Gallegos', 'bshm', '1', 'a', '3000000050'),
    ('24-0051', 'Yael Carrillo', 'bscrim', '2', 'a', '3000000051'),
    ('24-0052', 'Zara Escobar', 'bsit', '2', 'b', '3000000052'),
    ('24-0053', 'Aaron Ochoa', 'bshm', '2', 'c', '3000000053'),
    ('24-0054', 'Bethany Ponce', 'bscrim', '2', 'd', '3000000054'),
    ('24-0055', 'Caleb Barrera', 'bsit', '2', 'a', '3000000055'),
    ('24-0056', 'Dakota Villarreal', 'bshm', '3', 'a', '3000000056'),
    ('24-0057', 'Eli Trejo', 'bscrim', '3', 'b', '3000000057'),
    ('24-0058', 'Faith Zavala', 'bsit', '3', 'c', '3000000058'),
    ('24-0059', 'Gage Tapia', 'bshm', '3', 'd', '3000000059'),
    ('24-0060', 'Hope Rangel', 'bscrim', '3', 'a', '3000000060'),
    ('24-0061', 'Ivan Huerta', 'bsit', '4', 'a', '3000000061'),
    ('24-0062', 'Jade Montoya', 'bshm', '4', 'b', '3000000062'),
    ('24-0063', 'Kyle Bautista', 'bscrim', '4', 'c', '3000000063'),
    ('24-0064', 'Lily Ibarra', 'bsit', '4', 'd', '3000000064'),
    ('24-0065', 'Mason Garza', 'bshm', '1', 'a', '3000000065'),
    ('24-0066', 'Natalie Calderon', 'bscrim', '1', 'b', '3000000066'),
    ('24-0067', 'Owen Mora', 'bsit', '1', 'c', '3000000067'),
    ('24-0068', 'Piper Velasquez', 'bshm', '1', 'd', '3000000068'),
    ('24-0069', 'Reed Mendez', 'bscrim', '2', 'a', '3000000069'),
    ('24-0070', 'Sage Rojas', 'bsit', '2', 'b', '3000000070'),
    ('24-0071', 'Tyler Campos', 'bshm', '2', 'c', '3000000071'),
    ('24-0072', 'Uma Navarro', 'bscrim', '2', 'd', '3000000072'),
    ('24-0073', 'Van Guzman', 'bsit', '3', 'a', '3000000073'),
    ('24-0074', 'Willow Ayala', 'bshm', '3', 'b', '3000000074'),
    ('24-0075', 'Xander Estrada', 'bscrim', '3', 'c', '3000000075'),
    ('24-0076', 'Yasmin Ortega', 'bsit', '3', 'd', '3000000076'),
    ('24-0077', 'Zane Vasquez', 'bshm', '4', 'a', '3000000077'),
    ('24-0078', 'Aria Salas', 'bscrim', '4', 'b', '3000000078'),
    ('24-0079', 'Blake Cordova', 'bsit', '4', 'c', '3000000079'),
    ('24-0080', 'Chloe Avila', 'bshm', '4', 'd', '3000000080'),
    ('24-0081', 'Derek Benitez', 'bscrim', '1', 'a', '3000000081'),
    ('24-0082', 'Eden Colon', 'bsit', '1', 'b', '3000000082'),
    ('24-0083', 'Finn Miranda', 'bshm', '1', 'c', '3000000083'),
    ('24-0084', 'Gemma Cisneros', 'bscrim', '1', 'd', '3000000084'),
    ('24-0085', 'Hayden Bonilla', 'bsit', '2', 'a', '3000000085'),
    ('24-0086', 'Iris Pacheco', 'bshm', '2', 'b', '3000000086'),
    ('24-0087', 'Jace Duarte', 'bscrim', '2', 'c', '3000000087'),
    ('24-0088', 'Kira Escobedo', 'bsit', '2', 'd', '3000000088'),
    ('24-0089', 'Liam Galvan', 'bshm', '3', 'a', '3000000089'),
    ('24-0090', 'Maya Velasco', 'bscrim', '3', 'b', '3000000090'),
    ('24-0091', 'Noah Ybarra', 'bsit', '3', 'c', '3000000091'),
    ('24-0092', 'Olive Zamora', 'bshm', '3', 'd', '3000000092'),
    ('24-0093', 'Parker Xiong', 'bscrim', '4', 'a', '3000000093'),
    ('24-0094', 'Quinn Yee', 'bsit', '4', 'b', '3000000094'),
    ('24-0095', 'Riley Zuniga', 'bshm', '4', 'c', '3000000095'),
    ('24-0096', 'Skylar Arredondo', 'bscrim', '4', 'd', '3000000096'),
    ('24-0097', 'Tristan Barron', 'bsit', '1', 'a', '3000000097'),
    ('24-0098', 'Uma Cuevas', 'bshm', '1', 'b', '3000000098'),
    ('24-0099', 'Violet Davila', 'bscrim', '1', 'c', '3000000099'),
    ('24-0100', 'Weston Echevarria', 'bsit', '1', 'd', '3000000100')
ON CONFLICT (student_id) DO NOTHING;

-- 3. Add attendance for the new students (24-xxxx) to all events with random status
INSERT INTO attendance (student_id, event_id, status, is_paid)
SELECT s.student_id,
    e.id,
    CASE (floor(random() * 3))::int
        WHEN 0 THEN 'Present'
        WHEN 1 THEN 'Absent'
        ELSE 'Excused'
    END,
    random() < 0.4
FROM students s
CROSS JOIN events e
WHERE s.student_id LIKE '24-%'
ON CONFLICT (student_id, event_id) DO NOTHING;
