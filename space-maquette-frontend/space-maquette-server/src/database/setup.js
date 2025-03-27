// database/setup.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '..', 'data', 'space-maquette.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Set up database tables based on DBML schema
function setupDatabase() {
  console.log('Setting up database tables...');

  // Don't drop tables automatically
  db.serialize(() => {
    // Check if tables already exist
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'",
      (err, row) => {
        if (err) {
          console.error('Error checking database tables:', err.message);
          return;
        }

        if (row) {
          console.log('Database tables already exist, skipping setup');
          return;
        }

        console.log('Tables do not exist, creating from scratch');

        // First drop existing tables if any
        dropExistingTables();

        // Then create all tables in the correct order before trying to insert data
        db.run(`CREATE TABLE shows (
        id INTEGER PRIMARY KEY,
        work_name VARCHAR NOT NULL,
        artist VARCHAR NOT NULL,
        created TEXT NOT NULL,
        materials VARCHAR NOT NULL,
        scale VARCHAR,
        length VARCHAR,
        width VARCHAR,
        height VARCHAR,
        map INTEGER,
        lights INTEGER,
        use_backdrop BOOLEAN DEFAULT 0,
        backdrop_rgb VARCHAR,
        backdrop_model VARCHAR,
        current_scan INTEGER,
        pano BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

        // Continue with other table creation
        createMapTable();
        createLightTables();
        createScansTable();
        createSettingsTable();

        // Only insert data after all tables are created
        insertDefaultData();
      }
    );
  });
}

function dropExistingTables() {
  const tables = [
    'show_metadata',
    'backdrop_settings',
    'nogo_regions',
    'scan_regions',
    'height_map',
    'configuration',
    'shows',
    'map',
    'lights',
    'light',
    'scans',
    'settings',
  ];

  tables.forEach((table) => {
    db.run(`DROP TABLE IF EXISTS ${table}`);
  });
}

function createShowsTable() {
  db.run(`
    CREATE TABLE shows (
      id INTEGER PRIMARY KEY,
      work_name VARCHAR NOT NULL,
      artist VARCHAR NOT NULL,
      created TEXT NOT NULL,
      materials VARCHAR NOT NULL,
      scale VARCHAR,
      length VARCHAR,
      width VARCHAR,
      height VARCHAR,
      map INTEGER,
      lights INTEGER,
      use_backdrop BOOLEAN DEFAULT 0,
      backdrop_rgb VARCHAR,
      backdrop_model VARCHAR,
      current_scan INTEGER,
      pano BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function createMapTable() {
  db.run(`
    CREATE TABLE map (
      id INTEGER PRIMARY KEY,
      image VARCHAR,
      x INTEGER,
      y INTEGER,
      z INTEGER,
      go BOOLEAN DEFAULT 1,
      pano_low VARCHAR,
      pano_high VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function createLightTables() {
  // Light template table
  db.run(`
    CREATE TABLE light (
      id INTEGER PRIMARY KEY,
      name VARCHAR NOT NULL,
      description VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lights configuration table
  db.run(`
    CREATE TABLE lights (
      id INTEGER PRIMARY KEY,
      light INTEGER NOT NULL,
      rgb VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (light) REFERENCES light(id)
    )
  `);
}

function createScansTable() {
  db.run(`
    CREATE TABLE scans (
      id INTEGER PRIMARY KEY,
      show INTEGER NOT NULL,
      type VARCHAR NOT NULL,
      complete BOOLEAN DEFAULT 0,
      x1 INTEGER NOT NULL,
      y1 INTEGER NOT NULL,
      x2 INTEGER NOT NULL,
      y2 INTEGER NOT NULL,
      last_x INTEGER,
      last_y INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (show) REFERENCES shows(id)
    )
  `);
}

function createSettingsTable() {
  db.run(`
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_name VARCHAR NOT NULL,
      firmware_version VARCHAR NOT NULL,
      serial_number VARCHAR NOT NULL,
      current_show INT NOT NULL DEFAULT 1,
      velocity_x INTEGER NOT NULL,
      velocity_y INTEGER NOT NULL,
      velocity_z INTEGER NOT NULL,
      acceleration_x INTEGER NOT NULL,
      acceleration_y INTEGER NOT NULL,
      acceleration_z INTEGER NOT NULL,
      max_jerk_x INTEGER NOT NULL,
      max_jerk_y INTEGER NOT NULL,
      max_jerk_z INTEGER NOT NULL,
      rangefinder_offset_x DECIMAL(5,2) NOT NULL,
      rangefinder_offset_y DECIMAL(5,2) NOT NULL,
      min_distance INTEGER NOT NULL,
      max_distance INTEGER NOT NULL,
      collision_margin INTEGER NOT NULL,
      tilt_min INTEGER NOT NULL,
      tilt_max INTEGER NOT NULL,
      tilt_center INTEGER NOT NULL,
      tilt_speed INTEGER NOT NULL,
      home_velocity_x INTEGER NOT NULL,
      home_velocity_y INTEGER NOT NULL,
      home_velocity_z INTEGER NOT NULL,
      home_direction_x INTEGER NOT NULL,
      home_direction_y INTEGER NOT NULL,
      home_direction_z INTEGER NOT NULL,
      stage_min_x INTEGER NOT NULL,
      stage_min_y INTEGER NOT NULL,
      stage_min_z INTEGER NOT NULL,
      stage_max_x INTEGER NOT NULL,
      stage_max_y INTEGER NOT NULL,
      stage_max_z INTEGER NOT NULL,
      ethernet_port INTEGER NOT NULL,
      ethernet_dhcp BOOLEAN NOT NULL,
      ethernet_static_ip VARCHAR NOT NULL,
      ethernet_static_netmask VARCHAR NOT NULL,
      ethernet_static_gateway VARCHAR NOT NULL,
      ethernet_timeout INTEGER NOT NULL,
      ethernet_heartbeat INTEGER NOT NULL,
      ethernet_reconnect BOOLEAN NOT NULL,
      ethernet_logging BOOLEAN NOT NULL,
      ethernet_log_file VARCHAR NOT NULL,
      ethernet_log_level INTEGER NOT NULL,
      debug INTEGER NOT NULL,
      debug_level INTEGER NOT NULL,
      log_commands BOOLEAN NOT NULL,
      log_file VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_show) REFERENCES shows(id)
    )
  `);
}

function insertDefaultData() {
  // Insert default show
  db.run(
    `
    INSERT INTO shows (work_name, artist, created, materials, scale, use_backdrop)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    ['Cosmic Drift', 'Jane Doe', '2025', 'Mixed media, electronics', '1:10', 0]
  );

  // Insert default light templates
  const defaultLights = [
    { name: 'Main', description: 'Main scene light' },
    { name: 'Accent 1', description: 'Left accent light' },
    { name: 'Accent 2', description: 'Right accent light' },
    { name: 'Background', description: 'Background fill light' },
  ];

  const lightStmt = db.prepare(`
    INSERT INTO light (name, description)
    VALUES (?, ?)
  `);

  defaultLights.forEach((light) => {
    lightStmt.run(light.name, light.description);
  });

  lightStmt.finalize();

  // Insert default settings
  db.run(
    `
    INSERT INTO settings (
      system_name, firmware_version, serial_number,
      velocity_x, velocity_y, velocity_z,
      acceleration_x, acceleration_y, acceleration_z,
      max_jerk_x, max_jerk_y, max_jerk_z,
      rangefinder_offset_x, rangefinder_offset_y,
      min_distance, max_distance, collision_margin,
      tilt_min, tilt_max, tilt_center, tilt_speed,
      home_velocity_x, home_velocity_y, home_velocity_z,
      home_direction_x, home_direction_y, home_direction_z,
      stage_min_x, stage_min_y, stage_min_z,
      stage_max_x, stage_max_y, stage_max_z,
      ethernet_port, ethernet_dhcp, 
      ethernet_static_ip, ethernet_static_netmask, ethernet_static_gateway,
      ethernet_timeout, ethernet_heartbeat, ethernet_reconnect,
      ethernet_logging, ethernet_log_file, ethernet_log_level,
      debug, debug_level, log_commands, log_file
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      'Space Maquette', // system_name
      '1.0.0', // firmware_version
      'SM-2025-001', // serial_number
      300,
      300,
      150, // velocity_x, y, z
      1000,
      1000,
      1000, // acceleration_x, y, z
      5000,
      5000,
      5000, // max_jerk_x, y, z
      10.5,
      10.5, // rangefinder_offset_x, y
      10,
      1000, // min_distance, max_distance
      30, // collision_margin
      45,
      135,
      90,
      50, // tilt_min, tilt_max, tilt_center, tilt_speed
      100,
      100,
      50, // home_velocity_x, home_velocity_y, home_velocity_z
      1,
      1,
      -1, // home_direction_x, home_direction_y, home_direction_z
      0,
      0,
      0, // stage_min_x, stage_min_y, stage_min_z
      2000,
      2000,
      1000, // stage_max_x, stage_max_y, stage_max_z
      3001, // ethernet_port
      1, // ethernet_dhcp
      '192.168.1.100', // ethernet_static_ip
      '255.255.255.0', // ethernet_static_netmask
      '192.168.1.1', // ethernet_static_gateway
      30000, // ethernet_timeout
      5000, // ethernet_heartbeat
      1, // ethernet_reconnect
      1, // ethernet_logging
      'ETHERNET.LOG', // ethernet_log_file
      2, // ethernet_log_level
      0, // debug
      1, // debug_level
      1, // log_commands
      'COMMAND.LOG', // log_file
    ]
  );
}

module.exports = {
  db,
  setupDatabase,
};
