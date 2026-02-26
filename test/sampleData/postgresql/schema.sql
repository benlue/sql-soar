-- PostgreSQL version of sample schema
-- This should be run against a PostgreSQL database named 'soar_test'

-- Drop tables if they exist
DROP TABLE IF EXISTS "Person" CASCADE;

-- Create Person table with PostgreSQL syntax
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

-- Create indexes
CREATE INDEX "idx_person_name" ON "Person" ("name");
CREATE INDEX "idx_person_city" ON "Person" ("city");

-- Drop GeoLoc and PsnLoc tables if they exist
DROP TABLE IF EXISTS "PsnLoc" CASCADE;
DROP TABLE IF EXISTS "GeoLoc" CASCADE;

-- Create GeoLoc table
CREATE TABLE "GeoLoc" (
    "geID" SERIAL PRIMARY KEY,
    "addr" VARCHAR(256),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7)
);

-- Create PsnLoc table (junction table for Person and GeoLoc)
CREATE TABLE "PsnLoc" (
    "geID" BIGINT NOT NULL,
    "psnID" BIGINT NOT NULL,
    PRIMARY KEY ("geID", "psnID")
);

-- Add foreign key constraints
ALTER TABLE "PsnLoc" ADD CONSTRAINT "FK_plcRge" FOREIGN KEY ("geID")
    REFERENCES "GeoLoc" ("geID") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PsnLoc" ADD CONSTRAINT "FK_plcRpsn" FOREIGN KEY ("psnID")
    REFERENCES "Person" ("psnID") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add some comments
COMMENT ON TABLE "Person" IS 'Sample person table for PostgreSQL testing';
COMMENT ON COLUMN "Person"."psnID" IS 'Primary key - person ID';
COMMENT ON COLUMN "Person"."name" IS 'Person full name';
COMMENT ON COLUMN "Person"."age" IS 'Person age in years';
COMMENT ON TABLE "GeoLoc" IS 'Geographic location table';
COMMENT ON TABLE "PsnLoc" IS 'Junction table linking Person and GeoLoc';