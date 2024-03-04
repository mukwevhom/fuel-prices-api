CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS hstore;

CREATE TABLE IF NOT EXISTS coastal_prices (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	month TEXT NOT NULL UNIQUE,
	_95_lrp DOUBLE PRECISION DEFAULT NULL,
	_95_ulp DOUBLE PRECISION DEFAULT NULL,
	diesel_005 DOUBLE PRECISION DEFAULT NULL,
	diesel_0005 DOUBLE PRECISION DEFAULT NULL,
	illuminating_paraffin DOUBLE PRECISION DEFAULT NULL,
	liquefied_petroleum_gas DOUBLE PRECISION DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS inland_prices (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	month TEXT NOT NULL UNIQUE,
	_93_lrp DOUBLE PRECISION DEFAULT NULL,
	_93_ulp DOUBLE PRECISION DEFAULT NULL,
	_95_ulp DOUBLE PRECISION DEFAULT NULL,
	diesel_005 DOUBLE PRECISION DEFAULT NULL,
	diesel_0005 DOUBLE PRECISION DEFAULT NULL,
	illuminating_paraffin DOUBLE PRECISION DEFAULT NULL,
	liquefied_petroleum_gas DOUBLE PRECISION DEFAULT NULL
);

CREATE TABLE coastal_prices_update (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  month TEXT NOT NULL UNIQUE,
  prices hstore,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coastal_prices_update
ADD CONSTRAINT check_prices_types CHECK (prices ?& 'float_key'::text[] = ANY(regexp_split_to_array('[+-]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?', prices ?& 'float_key'::text[])));
