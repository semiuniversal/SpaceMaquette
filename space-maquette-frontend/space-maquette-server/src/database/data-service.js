// database/data-service.js
const { db } = require('./setup');

class DataService {
  // Shows
  async getShows() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM shows ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getShow(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM shows WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createShow(showData) {
    const {
      work_name,
      artist,
      created,
      materials,
      scale,
      length,
      width,
      height,
      use_backdrop,
      backdrop_rgb,
      backdrop_model,
      pano,
    } = showData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO shows (
          work_name, artist, created, materials, scale, length, width, height,
          use_backdrop, backdrop_rgb, backdrop_model, pano
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          work_name,
          artist,
          created,
          materials,
          scale,
          length,
          width,
          height,
          use_backdrop,
          backdrop_rgb,
          backdrop_model,
          pano,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...showData });
        }
      );
    });
  }

  async updateShow(id, showData) {
    const fields = Object.keys(showData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(showData);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE shows SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('Show not found'));
          else resolve({ id, ...showData });
        }
      );
    });
  }

  async deleteShow(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM shows WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Show not found'));
        else resolve({ id, deleted: true });
      });
    });
  }

  // Maps
  async getMap(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM map WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createMap(mapData) {
    const { image, x, y, z, go, pano_low, pano_high } = mapData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO map (image, x, y, z, go, pano_low, pano_high)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [image, x, y, z, go, pano_low, pano_high],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...mapData });
        }
      );
    });
  }

  // Settings (new improved version)
  async getSettings() {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM settings ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateSettings(settingsData) {
    console.log('Updating settings:', settingsData);

    try {
      // Check if settings exist
      const settings = await this.getSettings();

      if (!settings) {
        console.log('No settings record found, creating...');

        // Create default settings with required fields
        const defaultSettings = {
          system_name: 'Space Maquette',
          firmware_version: '1.0.0',
          serial_number: 'SM-2025-001',
          velocity_x: 300,
          velocity_y: 300,
          velocity_z: 150,
          acceleration_x: 1000,
          acceleration_y: 1000,
          acceleration_z: 500,
          max_jerk_x: 5000,
          max_jerk_y: 5000,
          max_jerk_z: 2500,
          rangefinder_offset_x: 10.5,
          rangefinder_offset_y: 10.5,
          min_distance: 10,
          max_distance: 1000,
          collision_margin: 30,
          tilt_min: 45,
          tilt_max: 135,
          tilt_center: 90,
          tilt_speed: 50,
          home_velocity_x: 100,
          home_velocity_y: 100,
          home_velocity_z: 50,
          home_direction_x: 1,
          home_direction_y: 1,
          home_direction_z: -1,
          stage_min_x: 0,
          stage_min_y: 0,
          stage_min_z: 0,
          stage_max_x: 800,
          stage_max_y: 800,
          stage_max_z: 500,
          ethernet_port: 8080,
          ethernet_dhcp: 0,
          ethernet_static_ip: '192.168.1.100',
          ethernet_static_netmask: '255.255.255.0',
          ethernet_static_gateway: '192.168.1.1',
          ethernet_timeout: 5000,
          ethernet_heartbeat: 1000,
          ethernet_reconnect: 1,
          ethernet_logging: 1,
          ethernet_log_file: 'ETHERNET.LOG',
          ethernet_log_level: 1,
          debug: 0,
          debug_level: 0,
          log_commands: 1,
          log_file: 'COMMAND.LOG',
        };

        // Apply user updates
        Object.assign(defaultSettings, settingsData);

        // Generate SQL
        const fields = Object.keys(defaultSettings);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(defaultSettings);

        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO settings (${fields.join(', ')}) VALUES (${placeholders})`,
            values,
            function (err) {
              if (err) {
                console.error('Error creating settings:', err);
                reject(err);
              } else {
                console.log('Created settings with ID:', this.lastID);
                resolve({ id: this.lastID, ...defaultSettings });
              }
            }
          );
        });
      } else {
        // Settings exist, update specific fields
        console.log(`Updating existing settings with ID ${settings.id}`);

        const fields = Object.keys(settingsData)
          .map((key) => `${key} = ?`)
          .join(', ');
        const values = Object.values(settingsData);

        return new Promise((resolve, reject) => {
          db.run(
            `UPDATE settings SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, settings.id],
            function (err) {
              if (err) {
                console.error('Error updating settings:', err);
                reject(err);
              } else {
                console.log(`Updated settings, rows affected: ${this.changes}`);
                resolve({ id: settings.id, ...settingsData });
              }
            }
          );
        });
      }
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }

  // Scans
  async getScans(showId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM scans WHERE show = ? ORDER BY id',
        [showId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createScan(scanData) {
    const { show, type, x1, y1, x2, y2, last_x, last_y } = scanData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO scans (show, type, x1, y1, x2, y2, last_x, last_y)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [show, type, x1, y1, x2, y2, last_x, last_y],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...scanData, complete: 0 });
        }
      );
    });
  }

  async updateScanStatus(id, complete, last_x, last_y) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE scans SET complete = ?, last_x = ?, last_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [complete ? 1 : 0, last_x, last_y, id],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('Scan not found'));
          else resolve({ id, complete, last_x, last_y });
        }
      );
    });
  }

  // Lights
  async getLightTemplates() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM light ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getLights(showId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT l.*, lt.name, lt.description 
         FROM lights l
         JOIN light lt ON l.light = lt.id
         WHERE l.id = ?`,
        [showId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = new DataService();
