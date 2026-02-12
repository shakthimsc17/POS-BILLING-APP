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

ALTER TABLE IF EXISTS ONLY public.uom_master DROP CONSTRAINT IF EXISTS uom_master_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.uom_master DROP CONSTRAINT IF EXISTS uom_master_base_uom_id_fkey;
ALTER TABLE IF EXISTS ONLY public.uom_conversions DROP CONSTRAINT IF EXISTS uom_conversions_to_uom_id_fkey;
ALTER TABLE IF EXISTS ONLY public.uom_conversions DROP CONSTRAINT IF EXISTS uom_conversions_from_uom_id_fkey;
ALTER TABLE IF EXISTS ONLY public.uom_conversions DROP CONSTRAINT IF EXISTS uom_conversions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.translations DROP CONSTRAINT IF EXISTS translations_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_sales_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_original_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_edited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_table_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_brands DROP CONSTRAINT IF EXISTS supplier_brands_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_brands DROP CONSTRAINT IF EXISTS supplier_brands_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_brands DROP CONSTRAINT IF EXISTS supplier_brands_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_processed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_original_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_inventory_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_uom_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.e_way_bills DROP CONSTRAINT IF EXISTS e_way_bills_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.e_way_bills DROP CONSTRAINT IF EXISTS e_way_bills_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cash_flow_entries DROP CONSTRAINT IF EXISTS cash_flow_entries_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_sales_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.brands DROP CONSTRAINT IF EXISTS brands_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_changed_by_fkey;
DROP INDEX IF EXISTS public.uom_conversions_customer_id_from_uom_id_to_uom_id_key;
DROP INDEX IF EXISTS public.translations_language_idx;
DROP INDEX IF EXISTS public.translations_key_idx;
DROP INDEX IF EXISTS public.translations_customer_id_key_language_key;
DROP INDEX IF EXISTS public.translations_customer_id_idx;
DROP INDEX IF EXISTS public.transactions_transaction_type_idx;
DROP INDEX IF EXISTS public.transactions_sales_customer_id_idx;
DROP INDEX IF EXISTS public.transactions_place_of_supply_idx;
DROP INDEX IF EXISTS public.transactions_original_transaction_id_idx;
DROP INDEX IF EXISTS public.transactions_customer_id_idx;
DROP INDEX IF EXISTS public.transactions_created_at_idx;
DROP INDEX IF EXISTS public.tables_customer_id_table_number_key;
DROP INDEX IF EXISTS public.tables_customer_id_idx;
DROP INDEX IF EXISTS public.table_orders_transaction_id_key;
DROP INDEX IF EXISTS public.table_orders_transaction_id_idx;
DROP INDEX IF EXISTS public.table_orders_table_id_idx;
DROP INDEX IF EXISTS public.table_orders_customer_id_idx;
DROP INDEX IF EXISTS public.suppliers_is_active_idx;
DROP INDEX IF EXISTS public.suppliers_gstin_idx;
DROP INDEX IF EXISTS public.suppliers_customer_id_name_key;
DROP INDEX IF EXISTS public.suppliers_customer_id_idx;
DROP INDEX IF EXISTS public.suppliers_customer_id_code_key;
DROP INDEX IF EXISTS public.suppliers_code_idx;
DROP INDEX IF EXISTS public.supplier_brands_supplier_id_idx;
DROP INDEX IF EXISTS public.supplier_brands_is_preferred_idx;
DROP INDEX IF EXISTS public.supplier_brands_customer_id_supplier_id_brand_id_key;
DROP INDEX IF EXISTS public.supplier_brands_customer_id_idx;
DROP INDEX IF EXISTS public.supplier_brands_brand_id_idx;
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
DROP INDEX IF EXISTS public.permissions_customer_type_page_key;
DROP INDEX IF EXISTS public.permissions_customer_type_idx;
DROP INDEX IF EXISTS public.items_supplier_id_idx;
DROP INDEX IF EXISTS public.items_supplier_code_idx;
DROP INDEX IF EXISTS public.items_mapping_code_idx;
DROP INDEX IF EXISTS public.items_manufacturer_code_idx;
DROP INDEX IF EXISTS public.items_internal_code_idx;
DROP INDEX IF EXISTS public.items_hsn_code_idx;
DROP INDEX IF EXISTS public.items_customer_id_idx;
DROP INDEX IF EXISTS public.items_code_idx;
DROP INDEX IF EXISTS public.items_category_id_idx;
DROP INDEX IF EXISTS public.items_brand_id_idx;
DROP INDEX IF EXISTS public.items_barcode_idx;
DROP INDEX IF EXISTS public.item_code_prefixes_prefix_key;
DROP INDEX IF EXISTS public.item_code_prefixes_prefix_idx;
DROP INDEX IF EXISTS public.e_way_bills_valid_until_idx;
DROP INDEX IF EXISTS public.e_way_bills_transaction_id_key;
DROP INDEX IF EXISTS public.e_way_bills_status_idx;
DROP INDEX IF EXISTS public.e_way_bills_e_way_bill_number_key;
DROP INDEX IF EXISTS public.e_way_bills_e_way_bill_number_idx;
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
DROP INDEX IF EXISTS public.brands_is_active_idx;
DROP INDEX IF EXISTS public.brands_customer_id_name_key;
DROP INDEX IF EXISTS public.brands_customer_id_idx;
DROP INDEX IF EXISTS public.brands_code_idx;
DROP INDEX IF EXISTS public.activity_logs_entity_type_idx;
DROP INDEX IF EXISTS public.activity_logs_entity_id_idx;
DROP INDEX IF EXISTS public.activity_logs_created_at_idx;
DROP INDEX IF EXISTS public.activity_logs_changed_by_idx;
ALTER TABLE IF EXISTS ONLY public.uom_master DROP CONSTRAINT IF EXISTS uom_master_pkey;
ALTER TABLE IF EXISTS ONLY public.uom_conversions DROP CONSTRAINT IF EXISTS uom_conversions_pkey;
ALTER TABLE IF EXISTS ONLY public.translations DROP CONSTRAINT IF EXISTS translations_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_pkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_brands DROP CONSTRAINT IF EXISTS supplier_brands_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_customers DROP CONSTRAINT IF EXISTS sales_customers_pkey;
ALTER TABLE IF EXISTS ONLY public.returns DROP CONSTRAINT IF EXISTS returns_pkey;
ALTER TABLE IF EXISTS ONLY public.quick_sale_items DROP CONSTRAINT IF EXISTS quick_sale_items_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_pkey;
ALTER TABLE IF EXISTS ONLY public.item_code_prefixes DROP CONSTRAINT IF EXISTS item_code_prefixes_pkey;
ALTER TABLE IF EXISTS ONLY public.e_way_bills DROP CONSTRAINT IF EXISTS e_way_bills_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.cash_flow_entries DROP CONSTRAINT IF EXISTS cash_flow_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_pkey;
ALTER TABLE IF EXISTS ONLY public.brands DROP CONSTRAINT IF EXISTS brands_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.uom_master;
DROP TABLE IF EXISTS public.uom_conversions;
DROP TABLE IF EXISTS public.translations;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.tables;
DROP TABLE IF EXISTS public.table_orders;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.supplier_brands;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.sales_customers;
DROP TABLE IF EXISTS public.returns;
DROP TABLE IF EXISTS public.quick_sale_items;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.items;
DROP TABLE IF EXISTS public.item_code_prefixes;
DROP TABLE IF EXISTS public.e_way_bills;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.cash_flow_entries;
DROP TABLE IF EXISTS public.carts;
DROP TABLE IF EXISTS public.brands;
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public._prisma_migrations;
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
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text,
    logo_url text,
    website character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    business_type character varying(50),
    default_language character varying(10) DEFAULT 'en'::character varying,
    receipt_language character varying(10) DEFAULT 'en'::character varying
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
-- Name: e_way_bills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.e_way_bills (
    id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    e_way_bill_number character varying(12),
    generated_date date,
    valid_until date,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    customer_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: item_code_prefixes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_code_prefixes (
    id uuid NOT NULL,
    prefix character varying(255) NOT NULL,
    description character varying(500),
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
    batch_number character varying(100),
    brand_id uuid,
    cess_rate numeric(5,2) DEFAULT 0 NOT NULL,
    expiry_date date,
    gst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    height_per_unit numeric(10,3),
    hsn_code character varying(8),
    internal_code character varying(100),
    is_perishable boolean DEFAULT false,
    length_per_unit numeric(10,3),
    manufacturer character varying(255),
    manufacturer_code character varying(100),
    mapping_code character varying(100),
    max_stock_level numeric(10,2),
    min_stock_level numeric(10,2),
    model_number character varying(100),
    package_quantity integer DEFAULT 1,
    package_type character varying(50),
    purchase_qty integer DEFAULT 0 NOT NULL,
    reorder_level numeric(10,2),
    shelf_life_days integer,
    storage_conditions character varying(255),
    supplier_code character varying(100),
    supplier_id uuid,
    uom_id uuid,
    volume_per_unit numeric(10,3),
    weight_per_unit numeric(10,3),
    width_per_unit numeric(10,3)
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
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL
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
    receipt_auto_print boolean DEFAULT true NOT NULL,
    language_settings jsonb DEFAULT '{}'::jsonb,
    supabase_url text,
    last_sync_at timestamp(6) with time zone,
    last_sync_status character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: supplier_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_brands (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    supplier_brand_code character varying(100),
    is_preferred boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(20),
    gstin character varying(50),
    pan_number character varying(20),
    payment_terms character varying(100),
    credit_limit numeric(15,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    cess_amount numeric(10,2) DEFAULT 0 NOT NULL,
    edited_at timestamp(6) with time zone,
    edited_by uuid,
    gst_amount numeric(10,2) DEFAULT 0 NOT NULL,
    original_transaction_id uuid,
    place_of_supply character varying(50),
    reverse_charge boolean DEFAULT false NOT NULL,
    sales_customer_id uuid,
    transaction_type character varying(20) DEFAULT 'sale'::character varying NOT NULL
);


--
-- Name: translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translations (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    key character varying(255) NOT NULL,
    language character varying(10) NOT NULL,
    value text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: uom_conversions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uom_conversions (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    from_uom_id uuid NOT NULL,
    to_uom_id uuid NOT NULL,
    conversion_factor numeric(10,6) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: uom_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uom_master (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(10) NOT NULL,
    category character varying(20) NOT NULL,
    base_uom_id uuid,
    conversion_factor numeric(10,6) DEFAULT 1.0,
    is_base_uom boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1b0b6c9f-725e-4f2f-bdfc-04ebc0e20607	c6908ef37cc2acdaa6d977ba331ea12de4b4ad28989fda394093c96f15c20bd3	2026-02-12 13:41:03.72049+05:30	20260112145951_admin	\N	\N	2026-02-12 13:41:03.045332+05:30	1
6ff83b64-200f-464b-9929-692b324fc2f5	9c84775fff2d9d7e86424bc455d9d98569b5f04ea342dce4e4f6219202e423a2	2026-02-12 13:41:03.867229+05:30	20260113151726_company	\N	\N	2026-02-12 13:41:03.732172+05:30	1
0ce239e9-72ed-4540-80a2-d7fe863312e2	086156d361cf9c01018ff2f34424c5d7f1d4551ad17ebbddda4222952f7a2e2a	2026-02-12 13:41:34.499371+05:30	20260127212106_add_display_name_to_items	\N	\N	2026-02-12 13:41:34.388669+05:30	1
3d52b39c-60a8-461c-8d04-9264a05aef78	f968247bbeda0d4d0c21f394824d3308d0db502370e540316126abfb6e72b17c	\N	20260118083449_newdb	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260118083449_newdb\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "companies" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"companies\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1163), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260118083449_newdb"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260118083449_newdb"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:41:16.301946+05:30	2026-02-12 13:41:03.878817+05:30	0
eedc3b91-bb60-4c3a-903b-134460d6134f	f968247bbeda0d4d0c21f394824d3308d0db502370e540316126abfb6e72b17c	2026-02-12 13:41:16.370312+05:30	20260118083449_newdb		\N	2026-02-12 13:41:16.370312+05:30	0
a736279d-12cd-42e4-bed0-70c28ae8a30b	f28fbf9ef679f1be18065e674c22a1e26e23dc7a905f8e0801382378b794b9d7	2026-02-12 13:41:20.599523+05:30	20260118134755_cafe	\N	\N	2026-02-12 13:41:20.435221+05:30	1
2ea4a219-a663-4ade-b8ba-011e01b7ec90	b47fcb67075b39716371eb0bb731799b8efe44fa51e1904e2032298af1bdc9e2	2026-02-12 13:42:32.74595+05:30	20260205161931_sync_schema_updates		\N	2026-02-12 13:42:32.74595+05:30	0
53496e0e-1b52-4706-ac97-e21b9dbd9c5c	65e00246830aec3ef54c71f8f947ac781f4f661ec3eb64b72e389116fcbabf2b	\N	20260127152538_add_table_management	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260127152538_add_table_management\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "business_type" of relation "companies" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"business_type\\" of relation \\"companies\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(6500), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260127152538_add_table_management"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260127152538_add_table_management"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:41:30.504191+05:30	2026-02-12 13:41:20.611278+05:30	0
3e41e619-d6f4-419c-a2dc-83d7a13273f3	65e00246830aec3ef54c71f8f947ac781f4f661ec3eb64b72e389116fcbabf2b	2026-02-12 13:41:30.577053+05:30	20260127152538_add_table_management		\N	2026-02-12 13:41:30.577053+05:30	0
1041cc5d-3b1d-4f00-88ac-b99e551fc2b3	ddfcc1cf9f529c8339a2c858f12f376ce2254b6e71b15e2786bcc807e34d30e9	\N	20260127220000_add_receipt_auto_print	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260127220000_add_receipt_auto_print\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "settings" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"settings\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(424), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260127220000_add_receipt_auto_print"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260127220000_add_receipt_auto_print"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:41:49.148773+05:30	2026-02-12 13:41:34.510745+05:30	0
8c78513f-a579-41fd-ace9-062d8f3a274f	ddfcc1cf9f529c8339a2c858f12f376ce2254b6e71b15e2786bcc807e34d30e9	2026-02-12 13:41:49.202837+05:30	20260127220000_add_receipt_auto_print		\N	2026-02-12 13:41:49.202837+05:30	0
9b2efa22-9b31-41e2-84e3-d8bc34411f7f	351df38158169c3d6016adc7201ead2d547f7e2d81b068c5c321f6e65a87f0e3	2026-02-12 13:41:53.090317+05:30	20260129120000_finalize_production_schema	\N	\N	2026-02-12 13:41:53.037839+05:30	1
33f896b6-ee55-4490-8022-cf39e1f3200f	7ed7e25f1130f8aed5020927e30058b7ac07fd042aea602f44206cac884b5a09	\N	20260201000000_add_quick_sale_cost_and_transaction_id	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260201000000_add_quick_sale_cost_and_transaction_id\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "quick_sale_items" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"quick_sale_items\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(424), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260201000000_add_quick_sale_cost_and_transaction_id"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260201000000_add_quick_sale_cost_and_transaction_id"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:42:00.553111+05:30	2026-02-12 13:41:53.101699+05:30	0
fb9098c4-ea4c-4c46-985d-9602d60e6c59	7ed7e25f1130f8aed5020927e30058b7ac07fd042aea602f44206cac884b5a09	\N	20260201000000_add_quick_sale_cost_and_transaction_id	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260201000000_add_quick_sale_cost_and_transaction_id\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "quick_sale_items" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"quick_sale_items\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(424), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260201000000_add_quick_sale_cost_and_transaction_id"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260201000000_add_quick_sale_cost_and_transaction_id"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:42:24.661407+05:30	2026-02-12 13:42:08.71976+05:30	0
257e9d29-b273-4e06-8265-e43966657ed3	7ed7e25f1130f8aed5020927e30058b7ac07fd042aea602f44206cac884b5a09	2026-02-12 13:42:24.692407+05:30	20260201000000_add_quick_sale_cost_and_transaction_id		\N	2026-02-12 13:42:24.692407+05:30	0
9f107432-1126-44ea-b027-17a60ff15609	b47fcb67075b39716371eb0bb731799b8efe44fa51e1904e2032298af1bdc9e2	\N	20260205161931_sync_schema_updates	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260205161931_sync_schema_updates\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "mapping_code" of relation "items" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"mapping_code\\" of relation \\"items\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(6500), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260205161931_sync_schema_updates"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260205161931_sync_schema_updates"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:42:32.668068+05:30	2026-02-12 13:42:28.696923+05:30	0
fd51261d-585f-4f27-bd80-cc09e0265fc1	978568d0c5fc8e4dbbc8c8b1fc78ccfa12733b6612464952bc4b03027f9f7248	\N	20260205164036_add_supabase_backup_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260205164036_add_supabase_backup_fields\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "last_sync_at" of relation "settings" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"last_sync_at\\" of relation \\"settings\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(6500), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260205164036_add_supabase_backup_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260205164036_add_supabase_backup_fields"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:42:40.204993+05:30	2026-02-12 13:42:36.505413+05:30	0
f5edf6c1-3de7-4f7a-be3a-0856bebbb237	978568d0c5fc8e4dbbc8c8b1fc78ccfa12733b6612464952bc4b03027f9f7248	2026-02-12 13:42:40.262874+05:30	20260205164036_add_supabase_backup_fields		\N	2026-02-12 13:42:40.262874+05:30	0
257704f8-82a9-4f3e-88e9-1a8637f67c55	b24b2f6efecd0974cd4417d9c4225684e4c0085c69f606d0e3b2eae09795e6c3	\N	20260207090000_add_returns_table	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260207090000_add_returns_table\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "returns" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"returns\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1163), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260207090000_add_returns_table"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260207090000_add_returns_table"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-12 13:42:48.36902+05:30	2026-02-12 13:42:44.356488+05:30	0
d7def0f7-da55-49c3-91dc-b811a8d87b42	b24b2f6efecd0974cd4417d9c4225684e4c0085c69f606d0e3b2eae09795e6c3	2026-02-12 13:42:48.393363+05:30	20260207090000_add_returns_table		\N	2026-02-12 13:42:48.393363+05:30	0
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, entity_type, entity_id, action, changed_by, changes, created_at) FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (id, customer_id, name, code, description, logo_url, website, contact_email, contact_phone, is_active, created_at, updated_at) FROM stdin;
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
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, customer_id, name, address, city, state, pincode, phone, email, gstin, website, logo, created_at, updated_at, business_type, default_language, receipt_language) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, password_hash, phone, address, city, state, pincode, is_admin, created_at, updated_at, customer_type) FROM stdin;
\.


--
-- Data for Name: e_way_bills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.e_way_bills (id, transaction_id, e_way_bill_number, generated_date, valid_until, status, customer_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: item_code_prefixes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_code_prefixes (id, prefix, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, customer_id, name, code, barcode, category_id, subcategory, cost, price, mrp, stock, image_url, created_at, display_name, batch_number, brand_id, cess_rate, expiry_date, gst_rate, height_per_unit, hsn_code, internal_code, is_perishable, length_per_unit, manufacturer, manufacturer_code, mapping_code, max_stock_level, min_stock_level, model_number, package_quantity, package_type, purchase_qty, reorder_level, shelf_life_days, storage_conditions, supplier_code, supplier_id, uom_id, volume_per_unit, weight_per_unit, width_per_unit) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, customer_type, page, can_view, can_edit, can_delete, can_view_profit, created_at, updated_at, is_hidden) FROM stdin;
\.


--
-- Data for Name: quick_sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quick_sale_items (id, name, quantity, price, total_amount, sold_at, added_to_inventory, inventory_item_id, created_at, updated_at, transaction_id) FROM stdin;
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
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, customer_id, activity_log_enabled, item_log_actions, receipt_header_option, receipt_auto_print, language_settings, supabase_url, last_sync_at, last_sync_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier_brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_brands (id, customer_id, supplier_id, brand_id, supplier_brand_code, is_preferred, created_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, customer_id, name, code, contact_person, email, phone, mobile, address, city, state, pincode, gstin, pan_number, payment_terms, credit_limit, is_active, created_at, updated_at) FROM stdin;
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

COPY public.transactions (id, customer_id, transaction_customer_id, total_amount, payment_method, received_amount, change_amount, items_json, created_at, cess_amount, edited_at, edited_by, gst_amount, original_transaction_id, place_of_supply, reverse_charge, sales_customer_id, transaction_type) FROM stdin;
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.translations (id, customer_id, key, language, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: uom_conversions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uom_conversions (id, customer_id, from_uom_id, to_uom_id, conversion_factor, created_at) FROM stdin;
\.


--
-- Data for Name: uom_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uom_master (id, customer_id, name, code, category, base_uom_id, conversion_factor, is_base_uom, created_at) FROM stdin;
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
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


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
-- Name: e_way_bills e_way_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.e_way_bills
    ADD CONSTRAINT e_way_bills_pkey PRIMARY KEY (id);


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
-- Name: supplier_brands supplier_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_brands
    ADD CONSTRAINT supplier_brands_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


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
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: uom_conversions uom_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_conversions
    ADD CONSTRAINT uom_conversions_pkey PRIMARY KEY (id);


--
-- Name: uom_master uom_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_master
    ADD CONSTRAINT uom_master_pkey PRIMARY KEY (id);


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
-- Name: brands_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brands_code_idx ON public.brands USING btree (code);


--
-- Name: brands_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brands_customer_id_idx ON public.brands USING btree (customer_id);


--
-- Name: brands_customer_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX brands_customer_id_name_key ON public.brands USING btree (customer_id, name);


--
-- Name: brands_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brands_is_active_idx ON public.brands USING btree (is_active);


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
-- Name: e_way_bills_e_way_bill_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX e_way_bills_e_way_bill_number_idx ON public.e_way_bills USING btree (e_way_bill_number);


--
-- Name: e_way_bills_e_way_bill_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX e_way_bills_e_way_bill_number_key ON public.e_way_bills USING btree (e_way_bill_number);


--
-- Name: e_way_bills_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX e_way_bills_status_idx ON public.e_way_bills USING btree (status);


--
-- Name: e_way_bills_transaction_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX e_way_bills_transaction_id_key ON public.e_way_bills USING btree (transaction_id);


--
-- Name: e_way_bills_valid_until_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX e_way_bills_valid_until_idx ON public.e_way_bills USING btree (valid_until);


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
-- Name: items_brand_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_brand_id_idx ON public.items USING btree (brand_id);


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
-- Name: items_hsn_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_hsn_code_idx ON public.items USING btree (hsn_code);


--
-- Name: items_internal_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_internal_code_idx ON public.items USING btree (internal_code);


--
-- Name: items_manufacturer_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_manufacturer_code_idx ON public.items USING btree (manufacturer_code);


--
-- Name: items_mapping_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_mapping_code_idx ON public.items USING btree (mapping_code);


--
-- Name: items_supplier_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_supplier_code_idx ON public.items USING btree (supplier_code);


--
-- Name: items_supplier_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_supplier_id_idx ON public.items USING btree (supplier_id);


--
-- Name: permissions_customer_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permissions_customer_type_idx ON public.permissions USING btree (customer_type);


--
-- Name: permissions_customer_type_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_customer_type_page_key ON public.permissions USING btree (customer_type, page);


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
-- Name: supplier_brands_brand_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_brands_brand_id_idx ON public.supplier_brands USING btree (brand_id);


--
-- Name: supplier_brands_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_brands_customer_id_idx ON public.supplier_brands USING btree (customer_id);


--
-- Name: supplier_brands_customer_id_supplier_id_brand_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX supplier_brands_customer_id_supplier_id_brand_id_key ON public.supplier_brands USING btree (customer_id, supplier_id, brand_id);


--
-- Name: supplier_brands_is_preferred_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_brands_is_preferred_idx ON public.supplier_brands USING btree (is_preferred);


--
-- Name: supplier_brands_supplier_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_brands_supplier_id_idx ON public.supplier_brands USING btree (supplier_id);


--
-- Name: suppliers_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_code_idx ON public.suppliers USING btree (code);


--
-- Name: suppliers_customer_id_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX suppliers_customer_id_code_key ON public.suppliers USING btree (customer_id, code);


--
-- Name: suppliers_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_customer_id_idx ON public.suppliers USING btree (customer_id);


--
-- Name: suppliers_customer_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX suppliers_customer_id_name_key ON public.suppliers USING btree (customer_id, name);


--
-- Name: suppliers_gstin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_gstin_idx ON public.suppliers USING btree (gstin);


--
-- Name: suppliers_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_is_active_idx ON public.suppliers USING btree (is_active);


--
-- Name: table_orders_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_customer_id_idx ON public.table_orders USING btree (customer_id);


--
-- Name: table_orders_table_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_table_id_idx ON public.table_orders USING btree (table_id);


--
-- Name: table_orders_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX table_orders_transaction_id_idx ON public.table_orders USING btree (transaction_id);


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
-- Name: transactions_place_of_supply_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_place_of_supply_idx ON public.transactions USING btree (place_of_supply);


--
-- Name: transactions_sales_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_sales_customer_id_idx ON public.transactions USING btree (sales_customer_id);


--
-- Name: transactions_transaction_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_transaction_type_idx ON public.transactions USING btree (transaction_type);


--
-- Name: translations_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_customer_id_idx ON public.translations USING btree (customer_id);


--
-- Name: translations_customer_id_key_language_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX translations_customer_id_key_language_key ON public.translations USING btree (customer_id, key, language);


--
-- Name: translations_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_key_idx ON public.translations USING btree (key);


--
-- Name: translations_language_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translations_language_idx ON public.translations USING btree (language);


--
-- Name: uom_conversions_customer_id_from_uom_id_to_uom_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uom_conversions_customer_id_from_uom_id_to_uom_id_key ON public.uom_conversions USING btree (customer_id, from_uom_id, to_uom_id);


--
-- Name: activity_logs activity_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: brands brands_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: e_way_bills e_way_bills_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.e_way_bills
    ADD CONSTRAINT e_way_bills_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: e_way_bills e_way_bills_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.e_way_bills
    ADD CONSTRAINT e_way_bills_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: items items_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: items items_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom_master(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: supplier_brands supplier_brands_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_brands
    ADD CONSTRAINT supplier_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: supplier_brands supplier_brands_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_brands
    ADD CONSTRAINT supplier_brands_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: supplier_brands supplier_brands_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_brands
    ADD CONSTRAINT supplier_brands_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: translations translations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: uom_conversions uom_conversions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_conversions
    ADD CONSTRAINT uom_conversions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: uom_conversions uom_conversions_from_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_conversions
    ADD CONSTRAINT uom_conversions_from_uom_id_fkey FOREIGN KEY (from_uom_id) REFERENCES public.uom_master(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: uom_conversions uom_conversions_to_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_conversions
    ADD CONSTRAINT uom_conversions_to_uom_id_fkey FOREIGN KEY (to_uom_id) REFERENCES public.uom_master(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: uom_master uom_master_base_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_master
    ADD CONSTRAINT uom_master_base_uom_id_fkey FOREIGN KEY (base_uom_id) REFERENCES public.uom_master(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: uom_master uom_master_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uom_master
    ADD CONSTRAINT uom_master_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

