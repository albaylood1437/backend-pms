create database MOF;
use MOF;


create table garage(
garageId int not null auto_increment,
garageName varchar(40) not null,
createdAt datetime default current_timestamp,
updatedAt datetime default current_timestamp,
primary key (garageId)
);

select * from garage;

create table supplier (
  supplierId INT NOT NULL auto_increment,
  supplierName varchar(40) not null,
  primary key(supplierId),
  createdAt datetime default current_timestamp,
  updatedAt datetime default current_timestamp
);

create table department (
  departmentId INT NOT NULL auto_increment,
  departmentName varchar(40) not null,
  primary key(departmentId),
  createdAt datetime default current_timestamp,
  updatedAt datetime default current_timestamp
);


create table part (
  partId INT NOT NULL auto_increment,
  partName varchar(40) not null,
  primary key(partId),
  createdAt datetime default current_timestamp,
  updatedAt datetime default current_timestamp
);





CREATE TABLE users (
  userId int AUTO_INCREMENT NOT NULL,
  username VARCHAR(30),
  email VARCHAR(30) UNIQUE NOT NULL,
  isAdmin VARCHAR(30) NOT NULL,
  password VARCHAR(200) NOT NULL,
  primary key (userId)
);

drop table users;

create table vehicle(
	vehicleId int AUTO_INCREMENT NOT NULL,
    plateNumber varchar(10) not null,
    model varchar(30) not null,
    modelYear int not null,
    chasisNubmer int not null,
    purchaseDate DATE not null,
    purchaseMileAge int not null,
	disposalDate DATE null,
    vehicleStatus varchar(10) default "No",
    primary key(vehicleId),
    departmentId int,
    INDEX departmentIdex (departmentId),
    FOREIGN KEY (departmentId)
        REFERENCES department(departmentId)
        ON UPDATE CASCADE ON DELETE set null
);

alter table vehicle
ADD column reason varchar(20);


SET sql_mode = '';
drop table vehicle;

create table drivers(
driverId int auto_increment NOT NULL,
driverName varchar(50) not null,
phone varchar(15) NOT NULL,
licensNo int not null,
description varchar(1024),
driverStatus varchar(30) default "No",
primary key(driverId)
);

drop table drivers;


create table driving(
drivingId int auto_increment not null,
drivingDate date not null,
drivingDescription varchar(132),
drivingStatus varchar(10) default "Active",
primary key(drivingId),
vehicleId int,
	INDEX vehicleIdex (vehicleId),
	FOREIGN KEY (vehicleId)
		REFERENCES vehicle(vehicleId)
		ON UPDATE CASCADE ON DELETE cascade,
driverId int,
	INDEX driverIndex (driverId),
	FOREIGN KEY (driverId)
		REFERENCES drivers(driverId)
		ON UPDATE CASCADE ON DELETE cascade
);
ALTER TABLE driving
ADD reason varchar(30) null;

drop table driving;


create table serviceExpense(
    id int auto_increment not null ,
	invoiceNumber varchar(15) NOT NULL unique,
    serviceDescription varchar(30),
    serviceDate datetime,
    serviceCost int,
    totalCost int,
    purchaseID int,
    createdAt datetime default current_timestamp,
    updatedAt datetime default current_timestamp,
    primary key(id),
	vehicleId int,
    INDEX vehicleIdex (vehicleId),
    FOREIGN KEY (vehicleId)
        REFERENCES vehicle(vehicleId)
        ON UPDATE CASCADE ON DELETE cascade
);

create table DeletedServiceExpense(
	 id int auto_increment not null ,
	invoiceNumber varchar(15) NOT NULL unique,
    serviceDescription varchar(30),
    serviceDate datetime,
    serviceCost int,
    totalCost int,
    purchaseID int,
    createdAt datetime default current_timestamp,
    updatedAt datetime default current_timestamp,
    primary key(id),
    vehicleId int,
    INDEX vehicleIdex (vehicleId),
    FOREIGN KEY (vehicleId)
        REFERENCES vehicle(vehicleId)
        ON UPDATE CASCADE ON DELETE cascade
);

drop table DeletedServiceExpense;


create table itemPart (
  itemPart varchar(40) NOT NULL,
  partName varchar(40) not null,
  partQuantity int not null,
  partPrice int not null,
  primary key(itemPart),
  createdAt datetime default current_timestamp,
  updatedAt datetime default current_timestamp,
  id int,
    INDEX serviceExpenseIndex (id),
    FOREIGN KEY (id)
        REFERENCES serviceExpense(id)
        ON UPDATE CASCADE ON DELETE cascade,
  	supplierId int,
    INDEX supplierIdex (supplierId),
    FOREIGN KEY (supplierId)
        REFERENCES supplier(supplierId)
        ON UPDATE CASCADE ON DELETE set null,
	garageId int,
    INDEX garageIdex (garageId),
    FOREIGN KEY (garageId)
        REFERENCES garage(garageId)
        ON UPDATE CASCADE ON DELETE set null
);

drop table itemPart;

create table DeletedItemPart (
  itemPart varchar(40) NOT NULL,
  partName varchar(40) not null,
  partQuantity int not null,
  partPrice int not null,
  primary key(itemPart),
  createdAt datetime default current_timestamp,
  updatedAt datetime default current_timestamp,
  id int not null,
  	supplierId int,
    INDEX supplierIdex (supplierId),
    FOREIGN KEY (supplierId)
        REFERENCES supplier(supplierId)
        ON UPDATE CASCADE ON DELETE set null,
	garageId int,
    INDEX garageIdex (garageId),
    FOREIGN KEY (garageId)
        REFERENCES garage(garageId)
        ON UPDATE CASCADE ON DELETE set null
);

drop table DeletedItemPart;

drop table serviceExpense;


select * from serviceExpense;

