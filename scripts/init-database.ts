import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    // Create API keys table
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          company_email VARCHAR(255) UNIQUE NOT NULL,
          quota VARCHAR(50) NOT NULL DEFAULT '0/1000',
          plan_id VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT FALSE,
          subscription_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key)`
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_company_email ON api_keys(company_email)`

    // Create update function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Create trigger
    await sql`DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys`
    await sql`
      CREATE TRIGGER update_api_keys_updated_at
          BEFORE UPDATE ON api_keys
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    console.log("Database initialized successfully!")

    // Check if database is working by counting rows
    const result = await sql`SELECT COUNT(*) as count FROM api_keys`
    console.log(`Current API keys in database: ${result[0].count}`)
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log("Database setup complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Database setup failed:", error)
    process.exit(1)
  })
