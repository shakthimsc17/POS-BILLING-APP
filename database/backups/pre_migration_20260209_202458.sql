--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_sales_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_original_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_edited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_table_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_processed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_original_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_inventory_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_sales_customer;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cash_flow_entries DROP CONSTRAINT IF EXISTS cash_flow_entries_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_sales_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_changed_by_fkey;
DROP TRIGGER IF EXISTS trigger_update_tables_updated_at ON public.tables;
DROP TRIGGER IF EXISTS trigger_update_table_orders_updated_at ON public.table_orders;
DROP TRIGGER IF EXISTS trigger_update_sales_customers_updated_at ON public.sales_customers;
DROP TRIGGER IF EXISTS trigger_update_quick_sale_items_updated_at ON public.quick_sale_items;
DROP TRIGGER IF EXISTS trigger_update_permissions_updated_at ON public.permissions;
DROP TRIGGER IF EXISTS trigger_update_item_code_prefixes_updated_at ON public.item_code_prefixes;
DROP TRIGGER IF EXISTS trigger_update_cash_flow_entries_updated_at ON public.cash_flow_entries;
DROP TRIGGER IF EXISTS trigger_update_carts_updated_at ON public.carts;
DROP INDEX IF EXISTS public.transactions_transaction_type_idx;
DROP INDEX IF EXISTS public.transactions_sales_customer_id_idx;
DROP INDEX IF EXISTS public.transactions_original_transaction_id_idx;
DROP INDEX IF EXISTS public.transactions_customer_id_idx;
DROP INDEX IF EXISTS public.transactions_created_at_idx;
DROP INDEX IF EXISTS public.tables_status_idx;
DROP INDEX IF EXISTS public.tables_customer_id_table_number_key;
DROP INDEX IF EXISTS public.tables_customer_id_idx;
DROP INDEX IF EXISTS public.table_orders_transaction_id_key;
DROP INDEX IF EXISTS public.table_orders_table_id_idx;
DROP INDEX IF EXISTS public.table_orders_status_idx;
DROP INDEX IF EXISTS public.table_orders_customer_id_idx;
DROP INDEX IF EXISTS public.table_orders_created_at_idx;
DROP INDEX IF EXISTS public.settings_customer_id_key;
DROP INDEX IF EXISTS public.settings_customer_id_idx;
DROP INDEX IF EXISTS public.sales_customers_mobile_idx;
DROP INDEX IF EXISTS public.returns_status_idx;
DROP INDEX IF EXISTS public.returns_return_type_idx;
DROP INDEX IF EXISTS public.returns_original_transaction_id_idx;
DROP INDEX IF EXISTS public.returns_customer_id_idx;
DROP INDEX IF EXISTS public.returns_created_at_idx;
DROP INDEX IF EXISTS public.quick_sale_items_transaction_id_idx;
DROP INDEX IF EXISTS public.quick_sale_items_sold_at_idx;
DROP INDEX IF EXISTS public.quick_sale_items_inventory_item_id_idx;
DROP INDEX IF EXISTS public.quick_sale_items_added_to_inventory_idx;
DROP INDEX IF EXISTS public.permissions_page_idx;
DROP INDEX IF EXISTS public.permissions_customer_type_page_key;
DROP INDEX IF EXISTS public.permissions_customer_type_idx;
DROP INDEX IF EXISTS public.items_mapping_code_idx;
DROP INDEX IF EXISTS public.items_customer_id_idx;
DROP INDEX IF EXISTS public.items_code_idx;
DROP INDEX IF EXISTS public.items_category_id_idx;
DROP INDEX IF EXISTS public.items_barcode_idx;
DROP INDEX IF EXISTS public.item_code_prefixes_prefix_key;
DROP INDEX IF EXISTS public.item_code_prefixes_prefix_idx;
DROP INDEX IF EXISTS public.idx_transactions_sales_customer_id;
DROP INDEX IF EXISTS public.idx_tables_status;
DROP INDEX IF EXISTS public.idx_tables_customer_id;
DROP INDEX IF EXISTS public.idx_table_orders_table_id;
DROP INDEX IF EXISTS public.idx_table_orders_status;
DROP INDEX IF EXISTS public.idx_table_orders_customer_id;
DROP INDEX IF EXISTS public.idx_table_orders_created_at;
DROP INDEX IF EXISTS public.idx_sales_customers_mobile;
DROP INDEX IF EXISTS public.idx_quick_sale_items_sold_at;
DROP INDEX IF EXISTS public.idx_quick_sale_items_inventory_item_id;
DROP INDEX IF EXISTS public.idx_quick_sale_items_added_to_inventory;
DROP INDEX IF EXISTS public.idx_permissions_page;
DROP INDEX IF EXISTS public.idx_permissions_customer_type;
DROP INDEX IF EXISTS public.idx_items_mapping_code;
DROP INDEX IF EXISTS public.idx_item_code_prefixes_prefix;
DROP INDEX IF EXISTS public.idx_customers_customer_type;
DROP INDEX IF EXISTS public.idx_cash_flow_entries_type;
DROP INDEX IF EXISTS public.idx_cash_flow_entries_entry_date;
DROP INDEX IF EXISTS public.idx_cash_flow_entries_customer_id;
DROP INDEX IF EXISTS public.idx_cash_flow_entries_category;
DROP INDEX IF EXISTS public.idx_carts_customer_id;
DROP INDEX IF EXISTS public.customers_phone_idx;
DROP INDEX IF EXISTS public.customers_email_key;
DROP INDEX IF EXISTS public.customers_email_idx;
DROP INDEX IF EXISTS public.customers_customer_type_idx;
DROP INDEX IF EXISTS public.companies_customer_id_key;
DROP INDEX IF EXISTS public.companies_customer_id_idx;
DROP INDEX IF EXISTS public.categories_customer_id_idx;
DROP INDEX IF EXISTS public.cash_flow_entries_type_idx;
DROP INDEX IF EXISTS public.cash_flow_entries_entry_date_idx;
DROP INDEX IF EXISTS public.cash_flow_entries_customer_id_idx;
DROP INDEX IF EXISTS public.cash_flow_entries_category_idx;
DROP INDEX IF EXISTS public.carts_customer_id_key;
DROP INDEX IF EXISTS public.carts_customer_id_idx;
DROP INDEX IF EXISTS public.activity_logs_entity_type_idx;
DROP INDEX IF EXISTS public.activity_logs_entity_id_idx;
DROP INDEX IF EXISTS public.activity_logs_created_at_idx;
DROP INDEX IF EXISTS public.activity_logs_changed_by_idx;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_pkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_customers DROP CONSTRAINT IF EXISTS sales_customers_pkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_pkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_pkey;
ALTER TABLE IF EXISTS ONLY public.item_code_prefixes DROP CONSTRAINT IF EXISTS item_code_prefixes_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.cash_flow_entries DROP CONSTRAINT IF EXISTS cash_flow_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.tables;
DROP TABLE IF EXISTS public.table_orders;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.sales_customers;
DROP TABLE IF EXISTS public.returns;
DROP TABLE IF EXISTS public.quick_sale_items;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.items;
DROP TABLE IF EXISTS public.item_code_prefixes;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.cash_flow_entries;
DROP TABLE IF EXISTS public.carts;
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    changed_by uuid NOT NULL,
    changes jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    items_json text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    payment_method character varying(20),
    sales_customer_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cash_flow_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_flow_entries (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    category character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    entry_date timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    subcategory character varying(255),
    brand character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    icon character varying(255)
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(20),
    phone character varying(20),
    email character varying(255),
    gstin character varying(50),
    website character varying(255),
    logo text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    business_type character varying(50)
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(20),
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    customer_type character varying(50) DEFAULT 'sales person'::character varying
);


--
-- Name: item_code_prefixes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_code_prefixes (
    id uuid NOT NULL,
    prefix character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    barcode character varying(255),
    category_id uuid,
    subcategory character varying(255),
    cost numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    mrp numeric(10,2),
    stock integer DEFAULT 0 NOT NULL,
    image_url text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    display_name character varying(255),
    purchase_qty integer DEFAULT 0 NOT NULL,
    mapping_code character varying(100)
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    customer_type character varying(50) NOT NULL,
    page character varying(100) NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_view_profit boolean DEFAULT false NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: quick_sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quick_sale_items (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    sold_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    added_to_inventory boolean DEFAULT false NOT NULL,
    inventory_item_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cost numeric(10,2),
    transaction_id uuid
);


--
-- Name: returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.returns (
    id uuid NOT NULL,
    original_transaction_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    return_type character varying(20) NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    refund_amount numeric(10,2),
    restocked_items jsonb,
    exchange_items jsonb,
    notes text,
    approved_by uuid,
    processed_by uuid,
    approved_at timestamp(6) with time zone,
    processed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sales_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_customers (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    mobile character varying(20) NOT NULL,
    email character varying(255),
    place character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    activity_log_enabled boolean DEFAULT true NOT NULL,
    item_log_actions character varying(20) DEFAULT 'update_delete'::character varying NOT NULL,
    receipt_header_option character varying(20) DEFAULT 'both'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    receipt_auto_print boolean DEFAULT true NOT NULL,
    last_sync_at timestamp(6) with time zone,
    last_sync_status character varying(50),
    supabase_url text
);


--
-- Name: table_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_orders (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    table_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    items_json text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2),
    payment_method character varying(20),
    transaction_id uuid,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tables (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    table_number character varying(50) NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    transaction_customer_id uuid,
    total_amount numeric(10,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    received_amount numeric(10,2),
    change_amount numeric(10,2),
    items_json text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sales_customer_id uuid,
    edited_at timestamp(6) with time zone,
    edited_by uuid,
    original_transaction_id uuid,
    transaction_type character varying(20) DEFAULT 'sale'::character varying NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9deaf2d6-495c-443a-ab2b-cf6f28c5bd17	c6908ef37cc2acdaa6d977ba331ea12de4b4ad28989fda394093c96f15c20bd3	2026-02-05 21:49:21.839972+05:30	20260112145951_admin	\N	\N	2026-02-05 21:49:21.118063+05:30	1
335f3f8a-49ee-4dcc-a718-4d51bdeff34b	9c84775fff2d9d7e86424bc455d9d98569b5f04ea342dce4e4f6219202e423a2	2026-02-05 21:49:22.020352+05:30	20260113151726_company	\N	\N	2026-02-05 21:49:21.851385+05:30	1
43d2da1e-cc01-480e-860d-4fa7f8d78464	65e00246830aec3ef54c71f8f947ac781f4f661ec3eb64b72e389116fcbabf2b	2026-02-05 21:49:23.782056+05:30	20260127152538_add_table_management	\N	\N	2026-02-05 21:49:22.032198+05:30	1
bb76d9cc-174b-45a9-adc3-9f0e996603af	086156d361cf9c01018ff2f34424c5d7f1d4551ad17ebbddda4222952f7a2e2a	2026-02-05 21:49:23.827102+05:30	20260127212106_add_display_name_to_items	\N	\N	2026-02-05 21:49:23.793534+05:30	1
206cc2c5-afcf-4f1a-9629-f05c0d73142f	ddfcc1cf9f529c8339a2c858f12f376ce2254b6e71b15e2786bcc807e34d30e9	2026-02-05 21:49:23.89413+05:30	20260127220000_add_receipt_auto_print	\N	\N	2026-02-05 21:49:23.838683+05:30	1
02a838ea-43de-42a2-83cd-8cbf1f8b7094	351df38158169c3d6016adc7201ead2d547f7e2d81b068c5c321f6e65a87f0e3	2026-02-05 21:49:23.927791+05:30	20260129120000_finalize_production_schema	\N	\N	2026-02-05 21:49:23.905587+05:30	1
7e5eb344-a6ef-4171-9f20-8a96d8d8462d	7ed7e25f1130f8aed5020927e30058b7ac07fd042aea602f44206cac884b5a09	2026-02-05 21:49:24.537324+05:30	20260201000000_add_quick_sale_cost_and_transaction_id	\N	\N	2026-02-05 21:49:23.939259+05:30	1
f4ae8c0a-8f2a-4f71-ac56-9c7546763acf	b47fcb67075b39716371eb0bb731799b8efe44fa51e1904e2032298af1bdc9e2	2026-02-05 22:01:18.450181+05:30	20260205161931_sync_schema_updates	\N	\N	2026-02-05 22:01:17.946027+05:30	1
9ce022d1-1ea8-4b64-9b5f-1f987fcdabe4	978568d0c5fc8e4dbbc8c8b1fc78ccfa12733b6612464952bc4b03027f9f7248	2026-02-05 22:10:52.78559+05:30	20260205164036_add_supabase_backup_fields	\N	\N	2026-02-05 22:10:52.728109+05:30	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, entity_type, entity_id, action, changed_by, changes, created_at) FROM stdin;
4843f1af-e2aa-4439-81b8-b10ec5e418c3	category	b017a7c8-cc65-494c-99e5-d9f442940ee4	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"name": "Womens", "subcategory": "Saree"}	2026-02-06 10:20:51.378+05:30
6d00c814-722b-401e-a9f0-2ff93845ac6c	category	0ad349b4-9d03-48fa-9df1-600fcbee8730	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"name": "Mens", "subcategory": "Jatty"}	2026-02-06 10:21:14.313+05:30
73b3ddc8-984c-497c-b0e6-9e4587286625	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"code": "ASR-ME-90", "name": "Jatty", "price": "100"}	2026-02-06 10:24:55.194+05:30
9a3936a7-9fe3-4183-90f8-d6d2341dc62a	item	4bb57794-d0dc-496d-90f0-0dcf626e31dd	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"code": "ASR-ME-S-02", "name": "saree-450", "price": "450"}	2026-02-06 10:24:55.206+05:30
e98ccd18-4748-445b-8aad-185e79cc0f14	item	1a7d20a7-1d77-45b0-a216-21ac1a7f4f75	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"code": "ASR-ME-85", "name": "Baniyan", "price": "100"}	2026-02-06 10:24:55.207+05:30
ce13d32a-19af-4838-9598-0862598716fe	transaction	22d4ca82-d37b-4c1a-b9e4-9061646bdbe8	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"itemsCount": 3, "totalAmount": "400", "paymentMethod": "cash"}	2026-02-06 10:26:14.718+05:30
bc95af6c-e53a-4431-8b3d-7309af4b250d	item	1a7d20a7-1d77-45b0-a216-21ac1a7f4f75	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 9}, "old": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 9}}	2026-02-06 10:26:14.763+05:30
5748df3a-3964-4f73-a77e-654b1d9c5811	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 9}, "old": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 9}}	2026-02-06 10:26:14.829+05:30
8b07d166-9a8e-40fd-8dcb-03ca97a0ce92	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 9}, "old": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 9}}	2026-02-06 10:26:14.884+05:30
02793b6e-37c7-4c8a-98e3-ca827f1a4f4f	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250"}	2026-02-06 10:24:55.207+05:30
d64e181d-ee3b-465d-8c78-61beee536e55	transaction	8c4d7818-9731-4744-acff-d87735aa8f51	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"itemsCount": 3, "totalAmount": "434", "paymentMethod": "cash"}	2026-02-06 10:36:12.016+05:30
7d67a63c-0dda-47d3-97e5-bb4b75c8a342	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 8}, "old": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 8}}	2026-02-06 10:36:12.037+05:30
1368c597-8565-4d71-abde-7dc1545f2a27	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 8}, "old": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 8}}	2026-02-06 10:36:12.104+05:30
fbe324f6-ec07-43d7-a353-0bcfc845fa4b	item	4bb57794-d0dc-496d-90f0-0dcf626e31dd	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-S-02", "name": "saree-450", "price": "450", "stock": 9}, "old": {"code": "ASR-ME-S-02", "name": "saree-450", "price": "450", "stock": 9}}	2026-02-06 10:37:14.615+05:30
211788e8-86dc-45ba-b83d-1bdda21ed239	item	1a7d20a7-1d77-45b0-a216-21ac1a7f4f75	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 8}, "old": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 8}}	2026-02-06 10:36:12.071+05:30
3c59a870-4b8a-4372-92e5-90fad9ddd21c	transaction	f884f360-f671-4d34-967b-dbbd0aaffb18	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"itemsCount": 2, "totalAmount": "200", "paymentMethod": "card"}	2026-02-06 10:36:59.72+05:30
c27a9c05-15ea-4017-af22-4833492b97fd	item	1a7d20a7-1d77-45b0-a216-21ac1a7f4f75	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 7}, "old": {"code": "ASR-ME-85", "name": "Baniyan", "price": "100", "stock": 7}}	2026-02-06 10:36:59.753+05:30
8b7d8459-b2b3-4cb1-827b-49984466a4f5	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 7}, "old": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 7}}	2026-02-06 10:36:59.799+05:30
3abe121c-683b-45cc-a81f-b68ddd33f14a	transaction	483daf10-8736-4541-b985-515c76dce59f	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"itemsCount": 3, "totalAmount": "750", "paymentMethod": "card"}	2026-02-06 10:37:14.524+05:30
5d8a1a07-f70c-4501-8870-c0a08556b5b5	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 7}, "old": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 7}}	2026-02-06 10:37:14.546+05:30
6412afac-e1a9-48f0-8692-ffaf24df33f9	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	update	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"new": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 6}, "old": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 6}}	2026-02-06 10:37:14.58+05:30
dadd8cfe-d1f0-47ca-859b-618049239528	transaction	d4c5b204-fa63-4019-9c8b-d7fb6b26efec	create	26d7ca67-ecc3-4735-897f-3862dbb8260d	{"itemsCount": 2, "totalAmount": "600", "paymentMethod": "card"}	2026-02-06 21:26:13.237+05:30
737504fb-5861-4b70-9252-abd524bd3ab3	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	update	26d7ca67-ecc3-4735-897f-3862dbb8260d	{"new": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 3}, "old": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 3}}	2026-02-06 21:26:13.293+05:30
8403845e-5812-49c5-928b-45a2f694b3b3	item	a143ef68-a8d2-4f1d-8269-b91e9211d304	update	26d7ca67-ecc3-4735-897f-3862dbb8260d	{"new": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 3}, "old": {"code": "ASR-ME-90", "name": "Jatty", "price": "100", "stock": 3}}	2026-02-06 21:26:13.327+05:30
1ccdca76-be7e-47c0-8f11-11e1fe2962ef	transaction	8d878f1f-1d1d-48ed-a619-c21c2fb0e4bc	create	115379c6-ab6e-4883-9901-e64b495fa7db	{"itemsCount": 2, "totalAmount": "700", "paymentMethod": "card"}	2026-02-06 22:12:30.671+05:30
f6cf402b-fd16-461f-b40a-a546f377b4a8	item	ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	update	115379c6-ab6e-4883-9901-e64b495fa7db	{"new": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 2}, "old": {"code": "ASR-ME-S-01", "name": "Saree-250", "price": "250", "stock": 2}}	2026-02-06 22:12:30.704+05:30
543ca74b-0400-4869-b577-847f6e5bd813	item	4bb57794-d0dc-496d-90f0-0dcf626e31dd	update	115379c6-ab6e-4883-9901-e64b495fa7db	{"new": {"code": "ASR-ME-S-02", "name": "saree-450", "price": "450", "stock": 7}, "old": {"code": "ASR-ME-S-02", "name": "saree-450", "price": "450", "stock": 7}}	2026-02-06 22:12:30.738+05:30
9ecc06be-348e-4752-b4c6-337d3af5f959	category	a5b018be-6970-4ad9-b2d4-1f4acda7447e	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"name": "Mens", "subcategory": "Baniyan"}	2026-02-06 10:20:51.378+05:30
d4ec3226-415a-4a09-932d-fe8db7821599	category	ee652637-3ef7-4f3e-9c48-701a61c366c7	create	cffb43c0-c9b9-4027-9540-b84ce75a14cb	{"name": "Mens", "subcategory": "Towel"}	2026-02-06 10:21:14.382+05:30
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, customer_id, items_json, tax_rate, discount, payment_method, sales_customer_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cash_flow_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_flow_entries (id, customer_id, type, category, amount, description, entry_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, customer_id, name, subcategory, brand, created_at, icon) FROM stdin;
a5b018be-6970-4ad9-b2d4-1f4acda7447e	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Mens	Baniyan	\N	2026-02-06 10:20:51.266+05:30	\N
b017a7c8-cc65-494c-99e5-d9f442940ee4	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Womens	Saree	\N	2026-02-06 10:20:51.267+05:30	\N
0ad349b4-9d03-48fa-9df1-600fcbee8730	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Mens	Jatty	\N	2026-02-06 10:21:14.232+05:30	\N
ee652637-3ef7-4f3e-9c48-701a61c366c7	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Mens	Towel	\N	2026-02-06 10:21:14.233+05:30	\N
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, customer_id, name, address, city, state, pincode, phone, email, gstin, website, logo, created_at, updated_at, business_type) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, password_hash, phone, address, city, state, pincode, is_admin, created_at, updated_at, customer_type) FROM stdin;
cffb43c0-c9b9-4027-9540-b84ce75a14cb	admin	admin@posbilling.com	$2b$10$xhz8pF7OMCF/GnyuWllIe.UEfXqAJ8OWTdCEYn/XpgyYffdFRPH0W	\N	\N	\N	\N	\N	t	2026-02-05 22:33:34.344+05:30	2026-02-05 22:34:01.274+05:30	Admin
115379c6-ab6e-4883-9901-e64b495fa7db	test	test@gmail.com	$2b$10$Q/wyg1i7Pn1f2sf5O1fMnOyzCMndOUQGfrHk4G08yoc52wDF0j80e	\N	\N	\N	\N	\N	f	2026-02-06 17:25:10.308+05:30	2026-02-06 17:25:10.308+05:30	sales person
26d7ca67-ecc3-4735-897f-3862dbb8260d	test1	test1@gmail.com	$2b$10$vtk/j/XCOkTTF8aS1asY7eQ2JO3XPLC1YQJzt27Kzx36iq7Wy/lnm	\N	\N	\N	\N	\N	f	2026-02-06 21:24:51.384+05:30	2026-02-06 21:24:51.384+05:30	sales person
1704a06a-057d-4689-87ae-5e89eae6e77c	Test User	test@example.com	$2b$10$FL9XstQCnevLF/zUnuwPZ.bb7.6CF9ggWBubrL2Gl0U2epxLMJQN6	\N	\N	\N	\N	\N	f	2026-02-06 21:42:52.482+05:30	2026-02-06 21:42:52.482+05:30	sales person
\.


--
-- Data for Name: item_code_prefixes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_code_prefixes (id, prefix, created_at, updated_at) FROM stdin;
ed79c765-ff45-4158-aaaa-3e82c779e626	ASR-ME-	2026-02-06 10:22:19.414+05:30	2026-02-06 10:22:19.414+05:30
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, customer_id, name, code, barcode, category_id, subcategory, cost, price, mrp, stock, image_url, created_at, display_name, purchase_qty, mapping_code) FROM stdin;
a143ef68-a8d2-4f1d-8269-b91e9211d304	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Jatty	ASR-ME-90	ASR-ME-90	ee652637-3ef7-4f3e-9c48-701a61c366c7	Baniyan	60.00	100.00	105.00	3	\N	2026-02-06 10:24:55.102+05:30	Jatty	7	\N
ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Saree-250	ASR-ME-S-01	ASR-ME-S-01	b017a7c8-cc65-494c-99e5-d9f442940ee4	Saree	150.00	250.00	300.00	2	\N	2026-02-06 10:24:55.105+05:30	Saree	8	\N
4bb57794-d0dc-496d-90f0-0dcf626e31dd	cffb43c0-c9b9-4027-9540-b84ce75a14cb	saree-450	ASR-ME-S-02	ASR-ME-S-02	b017a7c8-cc65-494c-99e5-d9f442940ee4	Saree	200.00	450.00	480.00	7	\N	2026-02-06 10:24:55.106+05:30	saree	3	\N
1a7d20a7-1d77-45b0-a216-21ac1a7f4f75	cffb43c0-c9b9-4027-9540-b84ce75a14cb	Baniyan	ASR-ME-85	ASR-ME-85	ee652637-3ef7-4f3e-9c48-701a61c366c7	Baniyan	65.00	100.00	103.00	5	\N	2026-02-06 10:24:55.104+05:30	Baniyan	5	\N
a7726d95-a0f5-4238-b50a-5e245e86647d	115379c6-ab6e-4883-9901-e64b495fa7db	Shirt	ASR-ME-01	ASR-ME-01	ee652637-3ef7-4f3e-9c48-701a61c366c7	Towel	400.00	650.00	\N	10	\N	2026-02-06 17:26:25.984+05:30	Shirt	0	3
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, customer_type, page, can_view, can_edit, can_delete, can_view_profit, is_hidden, created_at, updated_at) FROM stdin;
4c33b9de-36cd-4348-9b08-7747e8e4fe87	sales person	cart	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
e44b0b7a-8922-4869-8b47-62d95abb1a20	sales person	company	f	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
1f73dec2-e2ae-4886-9a43-e4fa17cc4776	sales person	customers	f	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
9a5fb7bb-1e84-47ea-a561-d0852917c876	sales person	bulk-operations	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
1f5e7e96-5da3-426c-b9ee-523521672308	sales person	settings	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
e173df02-b581-4218-b39d-8aaadf3fdb4f	sales person	activity-logs	f	f	f	f	f	2026-02-06 22:11:54.973+05:30	2026-02-06 22:11:54.973+05:30
a085bbbb-b219-4283-bb47-3e8aed7a7363	sales person	cash-flow	f	f	f	f	f	2026-02-06 22:11:54.973+05:30	2026-02-06 22:11:54.973+05:30
6ba3c58e-d627-4ef9-8969-83f7c3d445e7	sales person	export	f	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
a120413d-1b71-4128-ac6a-5afdc7c9e5bc	sales person	reports	f	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
33aee3c9-7400-44b1-b41f-e2c4e846e078	sales person	quick-sale-items	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
664c4440-3ef2-4ee3-8c9d-3c9fc5b45eb4	sales person	sales-performance	f	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
fac3db91-01cf-4e56-98cc-722910f82d57	sales person	categories	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
07913b6f-2687-4570-9c33-6200eeeffa2a	sales person	sales	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
f7e65131-c8a8-44ab-b7f2-9a933e257bb2	sales person	items	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
5c96f74f-0c8a-4b49-a305-319f7354fd02	sales person	dashboard	t	f	f	f	f	2026-02-06 22:11:54.972+05:30	2026-02-06 22:11:54.972+05:30
\.


--
-- Data for Name: quick_sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quick_sale_items (id, name, quantity, price, total_amount, sold_at, added_to_inventory, inventory_item_id, created_at, updated_at, cost, transaction_id) FROM stdin;
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.returns (id, original_transaction_id, customer_id, return_type, reason, status, refund_amount, restocked_items, exchange_items, notes, approved_by, processed_by, approved_at, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_customers (id, name, mobile, email, place, created_at, updated_at) FROM stdin;
a3113e1e-0c3b-4fda-9cc2-42164477a96f	Shakthi	8787878787	\N	\N	2026-02-06 10:26:09.798+05:30	2026-02-06 10:26:09.798+05:30
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, customer_id, activity_log_enabled, item_log_actions, receipt_header_option, created_at, updated_at, receipt_auto_print, last_sync_at, last_sync_status, supabase_url) FROM stdin;
26ed713c-8d05-4bf5-97ef-323ddab4c5a7	cffb43c0-c9b9-4027-9540-b84ce75a14cb	f	update_delete	both	2026-02-05 22:33:39.035+05:30	2026-02-06 10:44:50.368+05:30	t	2026-02-05 22:56:27.385+05:30	success	upsUog3PSbwDmS87iFgo0KlY8S5AVAqrfzss9SDbmqSqVEEp2Qlioinx/Si3bde1HoAgG7onkNiFcxMh1NlHYK7Vpe8KzU8Xpw4Ivvcd6a2pVbFjcYEGcxMc4zR/J3k6JXqHVxN2AfqmfCxqFxIH/UhkwXJHilZp
6d8526ca-3cf7-4634-8daf-270b3a205d9b	26d7ca67-ecc3-4735-897f-3862dbb8260d	t	update_delete	both	2026-02-06 21:25:13.535+05:30	2026-02-06 21:25:13.535+05:30	t	\N	\N	\N
eef93c0e-6bed-4f37-9f02-7b4fe93b12f3	115379c6-ab6e-4883-9901-e64b495fa7db	t	update_delete	both	2026-02-06 21:37:47.364+05:30	2026-02-06 21:37:47.364+05:30	t	\N	\N	\N
\.


--
-- Data for Name: table_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.table_orders (id, customer_id, table_id, status, items_json, tax_rate, discount, total_amount, payment_method, transaction_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tables (id, customer_id, table_number, capacity, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, customer_id, transaction_customer_id, total_amount, payment_method, received_amount, change_amount, items_json, created_at, sales_customer_id, edited_at, edited_by, original_transaction_id, transaction_type) FROM stdin;
8c4d7818-9731-4744-acff-d87735aa8f51	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	434.00	cash	434.00	\N	[{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":9,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"1a7d20a7-1d77-45b0-a216-21ac1a7f4f75","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Baniyan","display_name":"Baniyan","code":"ASR-ME-85","barcode":"ASR-ME-85","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"65","price":"100","mrp":"103","stock":9,"image_url":null,"created_at":"2026-02-06T04:54:55.104Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":9,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250}]	2026-02-06 10:36:11.886+05:30	a3113e1e-0c3b-4fda-9cc2-42164477a96f	\N	\N	\N	sale
f884f360-f671-4d34-967b-dbbd0aaffb18	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	200.00	card	200.00	\N	[{"item":{"id":"1a7d20a7-1d77-45b0-a216-21ac1a7f4f75","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Baniyan","display_name":"Baniyan","code":"ASR-ME-85","barcode":"ASR-ME-85","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"65","price":"100","mrp":"103","stock":8,"image_url":null,"created_at":"2026-02-06T04:54:55.104Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":8,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100}]	2026-02-06 10:36:59.627+05:30	\N	\N	\N	\N	sale
483daf10-8736-4541-b985-515c76dce59f	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	750.00	card	750.00	\N	[{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":8,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250},{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":7,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"4bb57794-d0dc-496d-90f0-0dcf626e31dd","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"saree-450","display_name":"saree","code":"ASR-ME-S-02","barcode":"ASR-ME-S-02","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"200","price":"450","mrp":"480","stock":10,"image_url":null,"created_at":"2026-02-06T04:54:55.106Z"},"quantity":1,"subtotal":450,"originalPrice":450}]	2026-02-06 10:37:14.443+05:30	\N	\N	\N	\N	sale
f11899f8-d782-450e-aaf4-6e8c95fe9872	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	700.00	cash	1000.00	300.00	[{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":7,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250},{"item":{"id":"4bb57794-d0dc-496d-90f0-0dcf626e31dd","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"saree-450","display_name":"saree","code":"ASR-ME-S-02","barcode":"ASR-ME-S-02","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"200","price":"450","mrp":"480","stock":9,"image_url":null,"created_at":"2026-02-06T04:54:55.106Z"},"quantity":1,"subtotal":450,"originalPrice":450}]	2026-02-06 10:47:56.447+05:30	\N	\N	\N	\N	sale
47b378c9-92bf-45ea-8b64-90a9aef61aac	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	200.00	cash	200.00	\N	[{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":6,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"1a7d20a7-1d77-45b0-a216-21ac1a7f4f75","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Baniyan","display_name":"Baniyan","code":"ASR-ME-85","barcode":"ASR-ME-85","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"65","price":"100","mrp":"103","stock":7,"image_url":null,"created_at":"2026-02-06T04:54:55.104Z"},"quantity":1,"subtotal":100,"originalPrice":100}]	2026-02-06 11:06:06.798+05:30	a3113e1e-0c3b-4fda-9cc2-42164477a96f	\N	\N	\N	sale
ad906806-7328-425e-8970-ab6001c1a4f3	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	394.00	card	394.00	\N	[{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":6,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250},{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":5,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"1a7d20a7-1d77-45b0-a216-21ac1a7f4f75","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Baniyan","display_name":"Baniyan","code":"ASR-ME-85","barcode":"ASR-ME-85","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"65","price":"100","mrp":"103","stock":6,"image_url":null,"created_at":"2026-02-06T04:54:55.104Z"},"quantity":1,"subtotal":100,"originalPrice":100}]	2026-02-06 15:18:49.109+05:30	a3113e1e-0c3b-4fda-9cc2-42164477a96f	\N	\N	\N	sale
22d4ca82-d37b-4c1a-b9e4-9061646bdbe8	cffb43c0-c9b9-4027-9540-b84ce75a14cb	\N	400.00	cash	400.00	\N	[{"item":{"id":"1a7d20a7-1d77-45b0-a216-21ac1a7f4f75","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Baniyan","display_name":"Baniyan","code":"ASR-ME-85","barcode":"ASR-ME-85","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"65","price":"100","mrp":"103","stock":10,"image_url":null,"created_at":"2026-02-06T04:54:55.104Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":10,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100},{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":10,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250}]	2026-02-05 04:56:00+05:30	a3113e1e-0c3b-4fda-9cc2-42164477a96f	\N	\N	\N	sale
d4c5b204-fa63-4019-9c8b-d7fb6b26efec	26d7ca67-ecc3-4735-897f-3862dbb8260d	\N	600.00	card	600.00	\N	[{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":5,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":2,"subtotal":500,"originalPrice":250},{"item":{"id":"a143ef68-a8d2-4f1d-8269-b91e9211d304","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Jatty","display_name":"Jatty","code":"ASR-ME-90","barcode":"ASR-ME-90","mapping_code":null,"category_id":"ee652637-3ef7-4f3e-9c48-701a61c366c7","subcategory":"Baniyan","cost":"60","price":"100","mrp":"105","stock":4,"image_url":null,"created_at":"2026-02-06T04:54:55.102Z"},"quantity":1,"subtotal":100,"originalPrice":100}]	2026-02-06 21:26:13.198+05:30	\N	\N	\N	\N	sale
8d878f1f-1d1d-48ed-a619-c21c2fb0e4bc	115379c6-ab6e-4883-9901-e64b495fa7db	\N	700.00	card	700.00	\N	[{"item":{"id":"ba3e6f93-9b90-4fb7-8e61-fb0d1714fe05","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"Saree-250","display_name":"Saree","code":"ASR-ME-S-01","barcode":"ASR-ME-S-01","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"150","price":"250","mrp":"300","stock":3,"image_url":null,"created_at":"2026-02-06T04:54:55.105Z"},"quantity":1,"subtotal":250,"originalPrice":250},{"item":{"id":"4bb57794-d0dc-496d-90f0-0dcf626e31dd","customer_id":"cffb43c0-c9b9-4027-9540-b84ce75a14cb","name":"saree-450","display_name":"saree","code":"ASR-ME-S-02","barcode":"ASR-ME-S-02","mapping_code":null,"category_id":"b017a7c8-cc65-494c-99e5-d9f442940ee4","subcategory":"Saree","cost":"200","price":"450","mrp":"480","stock":8,"image_url":null,"created_at":"2026-02-06T04:54:55.106Z"},"quantity":1,"subtotal":450,"originalPrice":450}]	2026-02-06 22:12:30.58+05:30	\N	\N	\N	\N	sale
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: cash_flow_entries cash_flow_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: item_code_prefixes item_code_prefixes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_code_prefixes
    ADD CONSTRAINT item_code_prefixes_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: quick_sale_items quick_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_sale_items
    ADD CONSTRAINT quick_sale_items_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: sales_customers sales_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_customers
    ADD CONSTRAINT sales_customers_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: table_orders table_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_changed_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_changed_by_idx ON public.activity_logs USING btree (changed_by);


--
-- Name: activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree (created_at);


--
-- Name: activity_logs_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_entity_id_idx ON public.activity_logs USING btree (entity_id);


--
-- Name: activity_logs_entity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_entity_type_idx ON public.activity_logs USING btree (entity_type);


--
-- Name: carts_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX carts_customer_id_idx ON public.carts USING btree (customer_id);


--
-- Name: carts_customer_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX carts_customer_id_key ON public.carts USING btree (customer_id);


--
-- Name: cash_flow_entries_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cash_flow_entries_category_idx ON public.cash_flow_entries USING btree (category);


--
-- Name: cash_flow_entries_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cash_flow_entries_customer_id_idx ON public.cash_flow_entries USING btree (customer_id);


--
-- Name: cash_flow_entries_entry_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cash_flow_entries_entry_date_idx ON public.cash_flow_entries USING btree (entry_date);


--
-- Name: cash_flow_entries_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cash_flow_entries_type_idx ON public.cash_flow_entries USING btree (type);


--
-- Name: categories_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_customer_id_idx ON public.categories USING btree (customer_id);


--
-- Name: companies_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX companies_customer_id_idx ON public.companies USING btree (customer_id);


--
-- Name: companies_customer_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX companies_customer_id_key ON public.companies USING btree (customer_id);


--
-- Name: customers_customer_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_customer_type_idx ON public.customers USING btree (customer_type);


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: idx_carts_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carts_customer_id ON public.carts USING btree (customer_id);


--
-- Name: idx_cash_flow_entries_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_flow_entries_category ON public.cash_flow_entries USING btree (category);


--
-- Name: idx_cash_flow_entries_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_flow_entries_customer_id ON public.cash_flow_entries USING btree (customer_id);


--
-- Name: idx_cash_flow_entries_entry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_flow_entries_entry_date ON public.cash_flow_entries USING btree (entry_date);


--
-- Name: idx_cash_flow_entries_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_flow_entries_type ON public.cash_flow_entries USING btree (type);


--
-- Name: idx_customers_customer_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_customer_type ON public.customers USING btree (customer_type);


--
-- Name: idx_item_code_prefixes_prefix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_code_prefixes_prefix ON public.item_code_prefixes USING btree (prefix);


--
-- Name: idx_items_mapping_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_mapping_code ON public.items USING btree (mapping_code);


--
-- Name: idx_permissions_customer_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_customer_type ON public.permissions USING btree (customer_type);


--
-- Name: idx_permissions_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_page ON public.permissions USING btree (page);


--
-- Name: idx_quick_sale_items_added_to_inventory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quick_sale_items_added_to_inventory ON public.quick_sale_items USING btree (added_to_inventory);


--
-- Name: idx_quick_sale_items_inventory_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quick_sale_items_inventory_item_id ON public.quick_sale_items USING btree (inventory_item_id);


--
-- Name: idx_quick_sale_items_sold_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quick_sale_items_sold_at ON public.quick_sale_items USING btree (sold_at);


--
-- Name: idx_sales_customers_mobile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_customers_mobile ON public.sales_customers USING btree (mobile);


--
-- Name: idx_table_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_created_at ON public.table_orders USING btree (created_at DESC);


--
-- Name: idx_table_orders_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_customer_id ON public.table_orders USING btree (customer_id);


--
-- Name: idx_table_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_status ON public.table_orders USING btree (status);


--
-- Name: idx_table_orders_table_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_table_id ON public.table_orders USING btree (table_id);


--
-- Name: idx_tables_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tables_customer_id ON public.tables USING btree (customer_id);


--
-- Name: idx_tables_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tables_status ON public.tables USING btree (status);


--
-- Name: idx_transactions_sales_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_sales_customer_id ON public.transactions USING btree (sales_customer_id);


--
-- Name: item_code_prefixes_prefix_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_code_prefixes_prefix_idx ON public.item_code_prefixes USING btree (prefix);


--
-- Name: item_code_prefixes_prefix_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX item_code_prefixes_prefix_key ON public.item_code_prefixes USING btree (prefix);


--
-- Name: items_barcode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_barcode_idx ON public.items USING btree (barcode);


--
-- Name: items_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_category_id_idx ON public.items USING btree (category_id);


--
-- Name: items_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_code_idx ON public.items USING btree (code);


--
-- Name: items_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_customer_id_idx ON public.items USING btree (customer_id);


--
-- Name: items_mapping_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_mapping_code_idx ON public.items USING btree (mapping_code);


--
-- Name: permissions_customer_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permissions_customer_type_idx ON public.permissions USING btree (customer_type);


--
-- Name: permissions_customer_type_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_customer_type_page_key ON public.permissions USING btree (customer_type, page);


--
-- Name: permissions_page_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permissions_page_idx ON public.permissions USING btree (page);


--
-- Name: quick_sale_items_added_to_inventory_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quick_sale_items_added_to_inventory_idx ON public.quick_sale_items USING btree (added_to_inventory);


--
-- Name: quick_sale_items_inventory_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quick_sale_items_inventory_item_id_idx ON public.quick_sale_items USING btree (inventory_item_id);


--
-- Name: quick_sale_items_sold_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quick_sale_items_sold_at_idx ON public.quick_sale_items USING btree (sold_at);


--
-- Name: quick_sale_items_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quick_sale_items_transaction_id_idx ON public.quick_sale_items USING btree (transaction_id);


--
-- Name: returns_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX returns_created_at_idx ON public.returns USING btree (created_at);


--
-- Name: returns_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX returns_customer_id_idx ON public.returns USING btree (customer_id);


--
-- Name: returns_original_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX returns_original_transaction_id_idx ON public.returns USING btree (original_transaction_id);


--
-- Name: returns_return_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX returns_return_type_idx ON public.returns USING btree (return_type);


--
-- Name: returns_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX returns_status_idx ON public.returns USING btree (status);


--
-- Name: sales_customers_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_customers_mobile_idx ON public.sales_customers USING btree (mobile);


--
-- Name: settings_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settings_customer_id_idx ON public.settings USING btree (customer_id);


--
-- Name: settings_customer_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX settings_customer_id_key ON public.settings USING btree (customer_id);


--
-- Name: table_orders_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_created_at_idx ON public.table_orders USING btree (created_at);


--
-- Name: table_orders_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_customer_id_idx ON public.table_orders USING btree (customer_id);


--
-- Name: table_orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_status_idx ON public.table_orders USING btree (status);


--
-- Name: table_orders_table_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_table_id_idx ON public.table_orders USING btree (table_id);


--
-- Name: table_orders_transaction_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX table_orders_transaction_id_key ON public.table_orders USING btree (transaction_id);


--
-- Name: tables_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tables_customer_id_idx ON public.tables USING btree (customer_id);


--
-- Name: tables_customer_id_table_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tables_customer_id_table_number_key ON public.tables USING btree (customer_id, table_number);


--
-- Name: tables_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tables_status_idx ON public.tables USING btree (status);


--
-- Name: transactions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_created_at_idx ON public.transactions USING btree (created_at);


--
-- Name: transactions_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_customer_id_idx ON public.transactions USING btree (customer_id);


--
-- Name: transactions_original_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_original_transaction_id_idx ON public.transactions USING btree (original_transaction_id);


--
-- Name: transactions_sales_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_sales_customer_id_idx ON public.transactions USING btree (sales_customer_id);


--
-- Name: transactions_transaction_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_transaction_type_idx ON public.transactions USING btree (transaction_type);


--
-- Name: carts trigger_update_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cash_flow_entries trigger_update_cash_flow_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_cash_flow_entries_updated_at BEFORE UPDATE ON public.cash_flow_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: item_code_prefixes trigger_update_item_code_prefixes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_item_code_prefixes_updated_at BEFORE UPDATE ON public.item_code_prefixes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: permissions trigger_update_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quick_sale_items trigger_update_quick_sale_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_quick_sale_items_updated_at BEFORE UPDATE ON public.quick_sale_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sales_customers trigger_update_sales_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_sales_customers_updated_at BEFORE UPDATE ON public.sales_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: table_orders trigger_update_table_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_table_orders_updated_at BEFORE UPDATE ON public.table_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tables trigger_update_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_sales_customer_id_fkey FOREIGN KEY (sales_customer_id) REFERENCES public.sales_customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flow_entries cash_flow_entries_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions fk_transactions_sales_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transactions_sales_customer FOREIGN KEY (sales_customer_id) REFERENCES public.sales_customers(id) ON DELETE SET NULL;


--
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quick_sale_items quick_sale_items_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_sale_items
    ADD CONSTRAINT quick_sale_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quick_sale_items quick_sale_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_sale_items
    ADD CONSTRAINT quick_sale_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returns returns_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returns returns_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: returns returns_original_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_original_transaction_id_fkey FOREIGN KEY (original_transaction_id) REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: returns returns_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: settings settings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: table_orders table_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: table_orders table_orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: table_orders table_orders_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tables tables_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_edited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_original_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_original_transaction_id_fkey FOREIGN KEY (original_transaction_id) REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_sales_customer_id_fkey FOREIGN KEY (sales_customer_id) REFERENCES public.sales_customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_transaction_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_customer_id_fkey FOREIGN KEY (transaction_customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

