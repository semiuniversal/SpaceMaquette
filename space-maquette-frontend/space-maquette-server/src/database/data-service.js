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
    const { work_name, artist, created, materials, scale, length, width, height, use_backdrop, backdrop_rgb, backdrop_model, pano } = showData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO shows (
          work_name, artist, created, materials, scale, length, width, height,
          use_backdrop, backdrop_rgb, backdrop_model, pano
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [work_name, artist, created, materials, scale, length, width, height, use_backdrop, backdrop_rgb, backdrop_model, pano],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...showData });
        }
      );
    });
  }
  
  async updateShow(id, showData) {
    const fields = Object.keys(showData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(showData);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE shows SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('Show not found'));
          else resolve({ id, ...showData });
        }
      );
    });
  }
  
  async deleteShow(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM shows WHERE id = ?', [id], function(err) {
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
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...mapData });
        }
      );
    });
  }
  
  // Settings
  async getSettings() {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM settings ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  
  async updateSettings(settingsData) {
    const fields = Object.keys(settingsData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(settingsData);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE settings SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ id: 1, ...settingsData });
        }
      );
    });
  }
  
  // Scans
  async getScans(showId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM scans WHERE show = ? ORDER BY id', [showId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  async createScan(scanData) {
    const { show, type, x1, y1, x2, y2, last_x, last_y } = scanData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO scans (show, type, x1, y1, x2, y2, last_x, last_y)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [show, type, x1, y1, x2, y2, last_x, last_y],
        function(err) {
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
        function(err) {
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