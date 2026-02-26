-- PostgreSQL in-memory schema for PGlite testing
-- No DROP statements needed (fresh database)
-- No COMMENT statements (not needed for testing)

CREATE TABLE "Person" (
    "psnID" SERIAL PRIMARY KEY,
    "name" VARCHAR(32) NOT NULL,
    "age" INTEGER,
    "weight" INTEGER,
    "addr" VARCHAR(64),
    "city" VARCHAR(32),
    "married" BOOLEAN DEFAULT FALSE,
    "created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_person_name" ON "Person" ("name");
CREATE INDEX "idx_person_city" ON "Person" ("city");

CREATE TABLE "GeoLoc" (
    "geID" SERIAL PRIMARY KEY,
    "addr" VARCHAR(256),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7)
);

CREATE TABLE "PsnLoc" (
    "geID" BIGINT NOT NULL,
    "psnID" BIGINT NOT NULL,
    PRIMARY KEY ("geID", "psnID")
);

ALTER TABLE "PsnLoc" ADD CONSTRAINT "FK_plcRge" FOREIGN KEY ("geID")
    REFERENCES "GeoLoc" ("geID") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PsnLoc" ADD CONSTRAINT "FK_plcRpsn" FOREIGN KEY ("psnID")
    REFERENCES "Person" ("psnID") ON DELETE CASCADE ON UPDATE CASCADE;
