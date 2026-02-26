-- PostgreSQL version of sample data
-- Insert sample data into Person table

INSERT INTO "Person" ("name", "age", "weight", "addr", "city", "married") VALUES
('John Doe', 30, 75, '123 Main St', 'New York', TRUE),
('Jane Smith', 25, 60, '456 Oak Ave', 'Los Angeles', FALSE),
('Bob Johnson', 35, 80, '789 Pine Rd', 'Chicago', TRUE),
('Alice Brown', 28, 65, '321 Elm St', 'Houston', FALSE),
('Charlie Wilson', 40, 85, '654 Maple Dr', 'Phoenix', TRUE),
('Diana Davis', 32, 58, '987 Cedar Ln', 'Philadelphia', FALSE),
('Eve Miller', 27, 62, '147 Birch Ct', 'San Antonio', FALSE),
('Frank Garcia', 45, 90, '258 Spruce Way', 'San Diego', TRUE),
('Grace Lee', 29, 55, '369 Willow St', 'Dallas', FALSE),
('Henry Clark', 38, 78, '741 Ash Blvd', 'San Jose', TRUE);

-- Insert some test records for specific test cases
INSERT INTO "Person" ("name", "age", "weight", "addr", "city", "married") VALUES
('Test User 1', 25, 70, 'Test Address 1', 'Test City', FALSE),
('Test User 2', 30, 75, 'Test Address 2', 'Test City', TRUE),
('Test User 3', 35, 80, 'Test Address 3', 'Test City', FALSE);

-- Insert sample data into GeoLoc table
INSERT INTO "GeoLoc" ("addr", "latitude", "longitude") VALUES
('Taipei, Taiwan', 25.0849444, 121.6986161),
('New Taipei, Taiwan', 25.1333980, 121.7457280),
('Oakland, CA', 37.8044557, -122.2711137),
('Chicago, IL', 41.8781136, -87.6297982),
('Houston, TX', 29.7604267, -95.3698028);

-- Insert sample data into PsnLoc table (linking persons to geographic locations)
INSERT INTO "PsnLoc" ("geID", "psnID") VALUES
(1, 2),
(2, 1),
(3, 3),
(4, 9),
(5, 4);

-- Show the inserted data
SELECT COUNT(*) as "Total Records" FROM "Person";
SELECT "name", "age", "city", "married" FROM "Person" WHERE "city" = 'Test City';
SELECT COUNT(*) as "Total GeoLoc Records" FROM "GeoLoc";
SELECT COUNT(*) as "Total PsnLoc Records" FROM "PsnLoc";