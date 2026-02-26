-- MySQL MEMORY engine schema for in-memory testing
-- Note: MEMORY engine does not support foreign keys or TEXT/BLOB columns

DROP TABLE IF EXISTS PsnLoc;
DROP TABLE IF EXISTS GeoLoc;
DROP TABLE IF EXISTS Person;

CREATE TABLE Person
(
    psnID         bigint not null auto_increment,
    name          varchar(64),
    addr          varchar(256),
    dob           date,
    modifyTime    datetime,
    primary key (psnID)
)
engine = MEMORY;


CREATE TABLE GeoLoc
(
   geID                 bigint not null auto_increment,
   addr                 varchar(256),
   latitude             decimal(10,7),
   longitude            decimal(10,7),
   primary key (geID)
)
engine = MEMORY;

CREATE TABLE PsnLoc
(
   geID                 bigint not null,
   psnID                bigint not null,
   primary key (geID, psnID)
)
engine = MEMORY;

-- No foreign key constraints (MEMORY engine limitation)
