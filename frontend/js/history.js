/**
 * WeatherSphere - Search History Management (history.js)
 * Manages user's recent successful searches with delete and clear all options.
 */

import { getHistory, deleteHistoryItem, clearHistory } from './api.js';
import { authManager } from './auth.js';
import { createHistoryItem, showLoading, showError, showToast } from './components.js';

export class HistoryManager {
  constructor() {
    this.historyList = [];
  }

  async init() {
    if (!authManager.requireAuth('Please sign in to view your search history.')) {
      return;
    }

    this.bindClearAll();
    await this.loadHistory();
  }

  bindClearAll() {
    const clearBtn = document.getElementById('btn-clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear your entire search history?')) return;
        try {
          const res = await clearHistory();
          if (res.success) {
            this.historyList = [];
            showToast('Search history cleared.', 'info');
            this.renderHistory();
          }
        } catch (err) {
          showToast(err.message || 'Unable to clear history', 'error');
        }
      });
    }
  }

  async loadHistory() {
    const container = document.getElementById('history-container');
    showLoading(container, 'Loading your recent searches...');

    try {
      const res = await getHistory();
      if (!res.success) throw new Error(res.message || 'Failed to fetch search history.');

      this.historyList = res.data || [];
      this.renderHistory();
    } catch (err) {
      showError(container, err.message, () => this.loadHistory());
    }
  }

  renderHistory() {
    const container = document.getElementById('history-container');
    const clearBtn = document.getElementById('btn-clear-history');

    if (!container) return;

    // Deduplicate history items by city name (case-insensitive)
    const seen = new Set();
    const uniqueHistory = [];
    for (const item of this.historyList) {
      const key = (item.city || '').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHistory.push(item);
      }
    }
    this.historyList = uniqueHistory;

    if (this.historyList.length === 0) {
      if (clearBtn) clearBtn.style.display = 'none';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <h3 class="empty-title">No Search History</h3>
          <p class="empty-desc">Your successful city searches will appear here automatically when you are signed in.</p>
          <a href="../index.html" class="btn-search" style="display: inline-flex; margin: 0 auto;">
            <i class="fa-solid fa-magnifying-glass"></i> Search Cities
          </a>
        </div>
      `;
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'history-list';

    this.historyList.forEach((item) => {
      const row = createHistoryItem(
        item,
        (city) => this.viewCityWeather(city),
        (id) => this.deleteItem(id)
      );
      list.appendChild(row);
    });

    container.appendChild(list);
  }

  viewCityWeather(city) {
    window.location.href = `../index.html?city=${encodeURIComponent(city)}`;
  }

  async deleteItem(id) {
    try {
      const res = await deleteHistoryItem(id);
      if (res.success) {
        this.historyList = this.historyList.filter(item => (item._id || item.id) !== id);
        showToast('Search item removed.', 'info');
        this.renderHistory();
      }
    } catch (err) {
      showToast(err.message || 'Unable to delete history item.', 'error');
    }
  }
}
