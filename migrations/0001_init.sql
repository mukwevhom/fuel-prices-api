CREATE TABLE IF NOT EXISTS coastal_prices (
	id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
	month TEXT NOT NULL UNIQUE,
	_95_lrp REAL DEFAULT NULL,
	_95_ulp REAL DEFAULT NULL,
	diesel_005 REAL DEFAULT NULL,
	diesel_0005 REAL DEFAULT NULL,
	illuminating_paraffin REAL DEFAULT NULL,
	liquefied_petroleum_gas REAL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS inland_prices (
	id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
	month TEXT NOT NULL UNIQUE,
	_93_lrp REAL DEFAULT NULL,
	_93_ulp REAL DEFAULT NULL,
	_95_ulp REAL DEFAULT NULL,
	diesel_005 REAL DEFAULT NULL,
	diesel_0005 REAL DEFAULT NULL,
	illuminating_paraffin REAL DEFAULT NULL,
	liquefied_petroleum_gas REAL DEFAULT NULL
);
