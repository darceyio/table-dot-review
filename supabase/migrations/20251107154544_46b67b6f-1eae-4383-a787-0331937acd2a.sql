-- Add crypto-specific fields to tip table
alter table tip add column if not exists blockchain_network text;
alter table tip add column if not exists tx_hash text;
alter table tip add column if not exists from_wallet_address text;
alter table tip add column if not exists to_wallet_address text;
alter table tip add column if not exists token_contract_address text;
alter table tip add column if not exists token_symbol text;
alter table tip add column if not exists block_number bigint;
alter table tip add column if not exists gas_paid_cents int;

-- Create index for tx_hash lookups
create index if not exists tip_tx_hash_idx on tip(tx_hash);

-- Add wallet_address to customer_session
alter table customer_session add column if not exists wallet_address text;

-- Add check to prevent duplicate transaction recordings
alter table tip add constraint unique_tx_hash unique (tx_hash);