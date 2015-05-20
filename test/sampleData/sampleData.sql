INSERT INTO Person (psnID, name, addr) VALUES
(1, 'John', null),
(2, 'David', 'Oakland'),
(3, 'Stacy', null);

INSERT INTO GeoLoc (geID, latitude, longitude) VALUES
(1, 25.0849444, 121.6986161),
(2, 25.1333980, 121.7457280);

INSERT INTO PsnLoc (geID, psnID) VALUES
(1, 2),
(2, 1);