INSERT INTO Person (psnID, name, addr, dob) VALUES
(1, 'John', null, '1980-03-21'),
(2, 'David', 'Oakland', '1976-12-23'),
(3, 'Stacy', null, '1988-06-4'),
(4, 'Roger', null, '1982-05-01'),
(5, 'Nancy', null, '1942-08-15');

INSERT INTO GeoLoc (geID, latitude, longitude) VALUES
(1, 25.0849444, 121.6986161),
(2, 25.1333980, 121.7457280);

INSERT INTO PsnLoc (geID, psnID) VALUES
(1, 2),
(2, 1);