/* ==========================================================================
   TASK GALAXY OS - SCRIPT ENGINE
   ES6 Modular Architecture for Gamified Space Todo Environment
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. SOUND GENERATION SYSTEM (WEB AUDIO SYNTHESIZER)
// --------------------------------------------------------------------------
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.isPlayingAmbient = false;
    this.muted = false;
    this.currentAmbientType = 'none';
  }

  init() {
    if (this.ctx) return;
    // Create AudioContext (must be inside user gesture)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.35;
    this.ambientGain.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.ctx) this.ctx.suspend();
    } else {
      if (this.ctx) {
        this.ctx.resume();
        if (this.isPlayingAmbient) {
          this.playAmbient(this.currentAmbientType);
        }
      }
    }
    return this.muted;
  }

  // Play a simple futuristic chime SFX (crystal ping)
  playChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1); // A6
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Play Level-Up Synthesized Fanfare
  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Arpeggio)
    chords.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.08);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(this.ctx.currentTime + index * 0.08);
      osc.stop(this.ctx.currentTime + index * 0.08 + 0.3);
    });
  }

  // Achievement unlock sound
  playAchievement() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.1); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(293.66, now); // D4
    osc2.frequency.setValueAtTime(440, now + 0.1); // A4
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Start Procedural Ambience Loop (Space Hum / Rain / Lofi Synth)
  playAmbient(type) {
    this.init();
    if (!this.ctx) return;
    
    this.stopAmbient();
    this.currentAmbientType = type;
    if (type === 'none' || this.muted) return;

    this.isPlayingAmbient = true;
    
    if (type === 'space') {
      // Space drone: low frequency oscillator modulators
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(60, this.ctx.currentTime); // Low 60Hz hum
      
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(0.2, this.ctx.currentTime); // Very slow LFO
      
      modGain.gain.setValueAtTime(4, this.ctx.currentTime); // Frequency shift range
      
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      
      this.ambientSource = carrier;
      carrier.connect(this.ambientGain);
      
      modulator.start();
      carrier.start();
    } 
    else if (type === 'rain') {
      // Rain noise generator
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Generate Pink Noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // normal gain
        b6 = white * 0.115926;
      }
      
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      // Create bandpass filter for atmospheric tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      
      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      
      this.ambientSource = whiteNoise;
      whiteNoise.start();
    }
    else if (type === 'lofi') {
      // Procedural Lofi Ambient generator (Periodic simple chords)
      const bufferSize = this.ctx.sampleRate * 8; // 8 second cycle
      const dryLofi = this.ctx.createGain();
      dryLofi.gain.value = 0.08;
      dryLofi.connect(this.ambientGain);

      let chordIndex = 0;
      // Minor Seventh chords: Am7 -> Dm7 -> Gmaj7 -> Cmaj7
      const progression = [
        [220, 261.63, 329.63, 392.00], // Am7
        [293.66, 349.23, 440.00, 523.25], // Dm7
        [196, 246.94, 293.66, 392.00], // G7
        [261.63, 329.63, 392.00, 493.88]  // Cmaj7
      ];

      const playChordCycle = () => {
        if (!this.isPlayingAmbient || this.currentAmbientType !== 'lofi') return;
        const now = this.ctx.currentTime;
        const freqs = progression[chordIndex];
        
        const voices = freqs.map(freq => {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          
          // Add soft detune for lofi retro effect
          osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.exponentialRampToValueAtTime(1200, now + 2);
          filter.frequency.exponentialRampToValueAtTime(300, now + 5.5);
          
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.12, now + 1.5);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 5.8);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dryLofi);
          
          osc.start(now);
          osc.stop(now + 6.0);
          return osc;
        });

        chordIndex = (chordIndex + 1) % progression.length;
        
        // Loop execution every 6 seconds
        this.lofiTimer = setTimeout(playChordCycle, 6000);
      };
      
      playChordCycle();
    }
  }

  stopAmbient() {
    this.isPlayingAmbient = false;
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch(e) {}
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
    if (this.lofiTimer) {
      clearTimeout(this.lofiTimer);
      this.lofiTimer = null;
    }
  }
}

// --------------------------------------------------------------------------
// 2. CENTRAL STATE ENGINE (GALAXY STATE)
// --------------------------------------------------------------------------
class GalaxyState {
  constructor() {
    this.tasks = [];
    this.categories = [];
    this.theme = 'cosmic';
    this.customTheme = null;
    this.xp = 0;
    this.level = 1;
    this.gold = 100;
    this.streak = 0;
    this.lastActivityDate = null;
    this.achievements = [];
    this.soundActive = true;
    this.unlockedThemes = ['cosmic', 'minimal'];
  }

  load() {
    const data = localStorage.getItem('task_galaxy_os_state');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.tasks = parsed.tasks || [];
        this.categories = parsed.categories || [];
        this.theme = parsed.theme || 'cosmic';
        this.customTheme = parsed.customTheme || null;
        this.xp = parsed.xp || 0;
        this.level = parsed.level || 1;
        this.gold = parsed.gold !== undefined ? parsed.gold : 100;
        this.streak = parsed.streak || 0;
        this.lastActivityDate = parsed.lastActivityDate || null;
        this.achievements = parsed.achievements || [];
        this.soundActive = parsed.soundActive !== undefined ? parsed.soundActive : true;
        this.unlockedThemes = parsed.unlockedThemes || ['cosmic', 'minimal'];
      } catch(e) {
        console.error("Failed loading local state: fallback to default.", e);
        this.initDefaults();
      }
    } else {
      this.initDefaults();
    }
  }

  initDefaults() {
    this.tasks = [];
    this.categories = [
      { id: 'work', name: 'Work Project', icon: '🚀', color: '#8b5cf6' },
      { id: 'personal', name: 'Personal Log', icon: '🧬', color: '#f43f5e' },
      { id: 'study', name: 'Knowledge Center', icon: '💻', color: '#3b82f6' },
      { id: 'fitness', name: 'Bio Maintenance', icon: '🏋️', color: '#10b981' },
      { id: 'finance', name: 'Aether Gold', icon: '🪙', color: '#f59e0b' }
    ];
    this.theme = 'cosmic';
    this.xp = 0;
    this.level = 1;
    this.gold = 150;
    this.streak = 0;
    this.achievements = [];
    this.save();
  }

  save() {
    const dump = {
      tasks: this.tasks,
      categories: this.categories,
      theme: this.theme,
      customTheme: this.customTheme,
      xp: this.xp,
      level: this.level,
      gold: this.gold,
      streak: this.streak,
      lastActivityDate: this.lastActivityDate,
      achievements: this.achievements,
      soundActive: this.soundActive,
      unlockedThemes: this.unlockedThemes
    };
    localStorage.setItem('task_galaxy_os_state', JSON.stringify(dump));
  }

  // XP calculation loop
  addXP(amount, sfxCallback) {
    this.xp += amount;
    const nextLevelXP = this.level * 100;
    if (this.xp >= nextLevelXP) {
      this.xp -= nextLevelXP;
      this.level += 1;
      this.gold += 50; // Reward gold for level-up
      if (sfxCallback) sfxCallback();
      this.triggerLevelCelebration();
    }
    this.save();
  }

  triggerLevelCelebration() {
    const celebration = document.getElementById('achievement-celebration');
    if (celebration) {
      document.getElementById('ach-popup-name').innerText = `Level Up: Level ${this.level}!`;
      document.getElementById('ach-popup-desc').innerText = `You are climbing the ladder of cosmic mastery. Keep expanding.`;
      const rewardText = celebration.querySelector('.ach-reward-badge');
      if (rewardText) rewardText.innerText = `🪙 +50 Aether Gold Awarded`;
      celebration.classList.remove('hidden');
      setTimeout(() => {
        celebration.classList.add('hidden');
      }, 5000);
    }
  }

  // Streak Tracker logic
  updateActivityStreak() {
    const today = new Date().toDateString();
    if (this.lastActivityDate === today) return; // already active today

    if (this.lastActivityDate) {
      const lastDate = new Date(this.lastActivityDate);
      const diffTime = Math.abs(new Date(today) - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        this.streak += 1;
      } else if (diffDays > 1) {
        this.streak = 1; // broken streak
      }
    } else {
      this.streak = 1;
    }
    this.lastActivityDate = today;
    this.save();
  }
}

// --------------------------------------------------------------------------
// 3. BACKGROUND COSMOS CANVAS (PARTICLE ANIMATIONS)
// --------------------------------------------------------------------------
class CosmicBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.implosionParticles = [];
    this.maxStars = 100;
    this.mouseX = 0;
    this.mouseY = 0;
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Spawn initial stars
    for (let i = 0; i < this.maxStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.05 + 0.01,
        alpha: Math.random() * 0.8 + 0.2,
        color: i % 10 === 0 ? 'rgba(139, 92, 246, 0.4)' : i % 15 === 0 ? 'rgba(59, 130, 246, 0.4)' : '#ffffff'
      });
    }
    
    // Start canvas loop
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Call on completing task
  triggerTaskImplosion(x, y, color) {
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.implosionParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color: color || 'rgba(139, 92, 246, 1)',
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw static orbital guide ring in center to align with Space Theme
    this.ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.3, 0, Math.PI * 2);
    this.ctx.stroke();

    // 1. Move and Draw Stars
    this.stars.forEach(star => {
      // Drifts slowly upwards/left
      star.y -= star.speed;
      star.x -= star.speed * 0.5;

      // Wrap around bounds
      if (star.y < 0) star.y = this.canvas.height;
      if (star.x < 0) star.x = this.canvas.width;

      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = star.alpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 2. Move and Draw Implosion Confetti
    this.implosionParticles = this.implosionParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // drag
      p.vy *= 0.95;
      p.alpha -= p.decay;

      if (p.alpha <= 0) return false;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      return true;
    });

    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame(() => this.animate());
  }
}

// --------------------------------------------------------------------------
// 4. MAIN TASK AND APPLICATION MANAGER
// --------------------------------------------------------------------------
class TaskGalaxyApp {
  constructor() {
    this.state = new GalaxyState();
    this.sounds = new SoundEngine();
    this.bg = null;
    
    this.activeFilterCategory = 'all';
    this.currentView = 'list';
    this.undoTimeoutId = null;
    this.activeTaskForFocus = null;

    // Pomodoro Timer values
    this.pomoDuration = 25 * 60; // 25 min default
    this.pomoRemaining = 25 * 60;
    this.pomoTimerId = null;
    this.pomoState = 'idle'; // idle, running, paused
    this.pomoType = 'focus'; // focus, shortBreak, longBreak

    this.calendarCurrentDate = new Date();
  }

  run() {
    this.state.load();
    this.bg = new CosmicBackground('space-canvas');
    
    // Bind global sound controller setting
    if (!this.state.soundActive) {
      this.sounds.muted = true;
      document.getElementById('toggle-audio-btn').classList.remove('sound-active');
      document.getElementById('sound-icon').innerText = '🔇';
    }

    // Trigger splash startup load sequence
    this.triggerBootSequence();
  }

  triggerBootSequence() {
    const splash = document.getElementById('splash-screen');
    const appShell = document.getElementById('app-shell');
    const progressBar = splash.querySelector('.boot-progress-fill');
    const terminalLines = splash.querySelectorAll('.terminal-line');
    
    // Step-by-step console message injection
    terminalLines.forEach(line => {
      const delay = parseInt(line.getAttribute('data-delay'));
      setTimeout(() => {
        line.classList.add('visible');
      }, delay);
    });

    // Animate progress bar filling
    setTimeout(() => {
      progressBar.style.width = '100%';
    }, 100);

    // Boot transition
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      appShell.classList.remove('hidden');
      
      // Update global systems
      this.state.updateActivityStreak();
      this.initEvents();
      this.renderAll();
      
      // Play welcome chord
      this.sounds.playLevelUp();
    }, 2400);
  }

  // --------------------------------------------------------------------------
  // DOM RENDERING ENGINES
  // --------------------------------------------------------------------------
  renderAll() {
    this.renderSidebarStats();
    this.renderCategorySidebar();
    this.renderTaskModalCategories();
    this.renderDashboardStats();
    
    // Dynamic Filtered Tasks
    const filteredTasks = this.getFilteredAndSortedTasks();
    
    // Render whichever panel is active
    if (this.currentView === 'list') {
      this.renderListView(filteredTasks);
    } else if (this.currentView === 'grid') {
      this.renderGridView(filteredTasks);
    } else if (this.currentView === 'kanban') {
      this.renderKanbanView(filteredTasks);
    } else if (this.currentView === 'timeline') {
      this.renderTimelineView(filteredTasks);
    } else if (this.currentView === 'calendar') {
      this.renderCalendarView();
    }
  }

  renderSidebarStats() {
    document.getElementById('profile-level-val').innerText = this.state.level;
    document.getElementById('xp-current-val').innerText = this.state.xp;
    
    const maxXP = this.state.level * 100;
    document.getElementById('xp-max-val').innerText = maxXP;
    
    // XP Ring calculation
    const xpPercent = this.state.xp / maxXP;
    const ringCircle = document.getElementById('xp-progress-ring');
    const circumference = 2 * Math.PI * 28; // r = 28
    ringCircle.style.strokeDashoffset = circumference - (xpPercent * circumference);

    document.getElementById('gold-val').innerText = this.state.gold;
    document.getElementById('shop-gold-val').innerText = this.state.gold;
    document.getElementById('streak-val').innerText = this.state.streak;

    // RPG Ranks
    const ranks = ['Beginner', 'Explorer', 'Creator', 'Master', 'Legend', 'Galaxy Master'];
    const rankIndex = Math.min(Math.floor(this.state.level / 5), ranks.length - 1);
    document.getElementById('profile-rank').innerText = ranks[rankIndex].toUpperCase();
  }

  renderCategorySidebar() {
    const list = document.getElementById('sidebar-categories');
    list.innerHTML = '';
    
    // Inject "All Anomalies" default toggle
    const allLi = document.createElement('li');
    allLi.innerHTML = `
      <button class="cat-filter-btn ${this.activeFilterCategory === 'all' ? 'active' : ''}" data-cat="all">
        <span>🌌 All Anomalies</span>
        <span class="count-badge">${this.state.tasks.length}</span>
      </button>
    `;
    list.appendChild(allLi);

    // Inject custom categories
    this.state.categories.forEach(cat => {
      const taskCount = this.state.tasks.filter(t => t.categoryId === cat.id).length;
      const li = document.createElement('li');
      li.innerHTML = `
        <button class="cat-filter-btn ${this.activeFilterCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          <span style="display:flex; align-items:center; gap:8px;">
            <span>${cat.icon}</span> ${cat.name}
          </span>
          <span style="display:flex; align-items:center; gap:6px;">
            <span class="cat-indicator" style="background-color:${cat.color}"></span>
            <span class="count-badge">${taskCount}</span>
          </span>
        </button>
      `;
      list.appendChild(li);
    });
  }

  renderTaskModalCategories() {
    const select = document.getElementById('task-category-select');
    select.innerHTML = '';
    this.state.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.name}`;
      select.appendChild(option);
    });
  }

  getFilteredAndSortedTasks() {
    let tasks = [...this.state.tasks];
    
    // 1. Text Search Filter
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    if (searchQuery) {
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery) ||
        (t.description && t.description.toLowerCase().includes(searchQuery))
      );
    }

    // 2. Category Filter
    if (this.activeFilterCategory !== 'all') {
      tasks = tasks.filter(t => t.categoryId === this.activeFilterCategory);
    }

    // 3. Sorting Execution
    const sortVal = document.getElementById('sort-select').value;
    if (sortVal === 'creation') {
      tasks.sort((a, b) => b.id - a.id);
    } else if (sortVal === 'due') {
      tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(`${a.dueDate}T${a.dueTime || '00:00'}`) - new Date(`${b.dueDate}T${b.dueTime || '00:00'}`);
      });
    } else if (sortVal === 'priority') {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    } else if (sortVal === 'alphabetical') {
      tasks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortVal === 'completion') {
      tasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
    }

    return tasks;
  }

  // --------------------------------------------------------------------------
  // LIST VIEW RENDERING
  // --------------------------------------------------------------------------
  renderListView(tasks) {
    const activeCont = document.getElementById('active-tasks-container');
    const compCont = document.getElementById('completed-tasks-container');
    activeCont.innerHTML = '';
    compCont.innerHTML = '';

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    document.getElementById('active-tasks-count').textContent = activeTasks.length;
    document.getElementById('completed-tasks-count').textContent = completedTasks.length;

    // Set empty state prompts if nothing matches
    if (activeTasks.length === 0) {
      activeCont.innerHTML = `<div class="empty-state">🌌 Core stable. No anomalies orbiting.</div>`;
    }
    if (completedTasks.length === 0) {
      compCont.innerHTML = `<div class="empty-state">No star structures solidified yet.</div>`;
    }

    activeTasks.forEach(t => activeCont.appendChild(this.createTaskCardElement(t)));
    completedTasks.forEach(t => compCont.appendChild(this.createTaskCardElement(t)));
  }

  // --------------------------------------------------------------------------
  // GRID VIEW RENDERING
  // --------------------------------------------------------------------------
  renderGridView(tasks) {
    const cont = document.getElementById('grid-tasks-container');
    cont.innerHTML = '';
    if (tasks.length === 0) {
      cont.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">🌌 Core stable. No galactic targets created.</div>`;
      return;
    }
    tasks.forEach(t => cont.appendChild(this.createTaskCardElement(t)));
  }

  // --------------------------------------------------------------------------
  // KANBAN VIEW RENDERING
  // --------------------------------------------------------------------------
  renderKanbanView(tasks) {
    const todoList = document.getElementById('kanban-todo-list');
    const progressList = document.getElementById('kanban-progress-list');
    const doneList = document.getElementById('kanban-done-list');
    
    todoList.innerHTML = '';
    progressList.innerHTML = '';
    doneList.innerHTML = '';

    const active = tasks.filter(t => !t.completed);
    const done = tasks.filter(t => t.completed);

    // Filter active into 'todo' (no focus task) and 'progress' (focus task status or custom field)
    // For simplicity, we can let user drag tasks in lanes. Let's add a "kanbanStatus" field to task.
    // If not existing, active tasks default to 'todo'.
    active.forEach(t => {
      const status = t.kanbanStatus || 'todo';
      const el = this.createTaskCardElement(t);
      el.draggable = true;
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', t.id);
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));

      if (status === 'todo') {
        todoList.appendChild(el);
      } else {
        progressList.appendChild(el);
      }
    });

    done.forEach(t => {
      const el = this.createTaskCardElement(t);
      el.draggable = true;
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', t.id);
      });
      doneList.appendChild(el);
    });

    // Update Kanban Counters
    document.getElementById('kanban-todo-count').textContent = todoList.children.length;
    document.getElementById('kanban-progress-count').textContent = progressList.children.length;
    document.getElementById('kanban-done-count').textContent = doneList.children.length;
  }

  // --------------------------------------------------------------------------
  // TIMELINE VIEW RENDERING
  // --------------------------------------------------------------------------
  renderTimelineView(tasks) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    // Sort chronological: closest deadline first
    const sortedTimeline = [...tasks].sort((a,b) => {
      if(!a.dueDate) return 1;
      if(!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (sortedTimeline.length === 0) {
      container.innerHTML = `<div class="empty-state">Chronos is quiet. No timelines mapped.</div>`;
      return;
    }

    sortedTimeline.forEach(t => {
      const node = document.createElement('div');
      node.className = `timeline-card-node ${t.completed ? 'completed' : ''}`;
      
      const dateLabel = t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'No Expiration';
      
      node.innerHTML = `
        <div class="timeline-node-dot"></div>
        <span class="timeline-date-label">${dateLabel} ${t.dueTime || ''}</span>
      `;
      
      const card = this.createTaskCardElement(t);
      node.appendChild(card);
      container.appendChild(node);
    });
  }

  // --------------------------------------------------------------------------
  // CALENDAR VIEW RENDERING
  // --------------------------------------------------------------------------
  renderCalendarView() {
    const label = document.getElementById('cal-month-year-label');
    const daysGrid = document.getElementById('calendar-days-grid');
    daysGrid.innerHTML = '';

    const year = this.calendarCurrentDate.getFullYear();
    const month = this.calendarCurrentDate.getMonth();

    // Render title label
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label.textContent = `${monthNames[month]} ${year}`;

    // Get dates boundary
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // Fill previous month trailing days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayVal = prevLastDay - x + 1;
      const cell = this.createCalendarCellElement(year, month - 1, dayVal, true);
      daysGrid.appendChild(cell);
    }

    // Fill current month days
    const today = new Date();
    for (let i = 1; i <= lastDay; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      const cell = this.createCalendarCellElement(year, month, i, false, isToday);
      daysGrid.appendChild(cell);
    }

    // Fill next month leading days (to complete 42 cell grid layout)
    const totalCells = daysGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let j = 1; j <= remainingCells; j++) {
      const cell = this.createCalendarCellElement(year, month + 1, j, true);
      daysGrid.appendChild(cell);
    }
  }

  createCalendarCellElement(year, month, day, isInactive, isToday = false) {
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${isInactive ? 'inactive-month' : ''} ${isToday ? 'today' : ''}`;
    cell.innerHTML = `<span class="day-number">${day}</span>`;

    // Filter tasks due on this cell date
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = this.state.tasks.filter(t => t.dueDate === dateStr);
    
    const tasksWrap = document.createElement('div');
    tasksWrap.className = 'calendar-tasks-wrap';

    dayTasks.forEach(t => {
      const pill = document.createElement('div');
      pill.className = `cal-task-pill ${t.completed ? 'completed' : ''}`;
      pill.textContent = t.title;
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTaskModal(t);
      });
      tasksWrap.appendChild(pill);
    });

    cell.appendChild(tasksWrap);

    // Double click to add task on specific date
    cell.addEventListener('dblclick', () => {
      this.openTaskModal(null, dateStr);
    });

    return cell;
  }

  // --------------------------------------------------------------------------
  // TASK CARD CREATION & RENDER UTIL
  // --------------------------------------------------------------------------
  createTaskCardElement(task) {
    const card = document.createElement('article');
    card.className = `task-card glass-box priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    card.dataset.id = task.id;

    // Get Category Info
    const cat = this.state.categories.find(c => c.id === task.categoryId) || { icon: '🌌', name: 'Cosmic', color: 'var(--primary)' };

    // Subtask statistics calculation
    const totalSubs = task.subtasks ? task.subtasks.length : 0;
    const completedSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const subPercentage = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

    // Evaluate Expiration indicator class
    let dateClass = '';
    let urgencyLabel = 'Upcoming';
    if (task.dueDate && !task.completed) {
      const due = new Date(`${task.dueDate}T${task.dueTime || '23:59'}`);
      const now = new Date();
      const diffTime = due - now;
      const diffHrs = diffTime / (1000 * 60 * 60);
      
      if (diffTime < 0) {
        dateClass = 'overdue';
        urgencyLabel = 'Overdue';
      } else if (diffHrs <= 24) {
        dateClass = 'due-soon';
        urgencyLabel = 'Due Soon';
      }
    }

    card.innerHTML = `
      <div class="task-cb-wrap">
        <input type="checkbox" class="task-cb-input" ${task.completed ? 'checked' : ''} aria-label="Toggle task status">
        <div class="task-cb-custom"></div>
      </div>
      <div class="task-info">
        <div class="task-title-line">
          <span class="task-title" title="Double click to edit inline">${task.title}</span>
        </div>
        <div class="task-meta">
          <span class="meta-tag tag-cat" style="--cat-color: ${cat.color}; --cat-border: ${cat.color}44;">
            <span>${cat.icon}</span> ${cat.name}
          </span>
          ${task.dueDate ? `
            <span class="meta-tag tag-date ${dateClass}">
              📅 ${task.dueDate} ${task.dueTime || ''} (${urgencyLabel})
            </span>
          ` : ''}
          ${task.recurrence && task.recurrence !== 'none' ? `
            <span class="meta-tag">🔁 ${task.recurrence}</span>
          ` : ''}
          ${totalSubs > 0 ? `
            <span class="meta-tag meta-sub-progress">
              <span>⑂</span> ${completedSubs}/${totalSubs} Subtasks
              <div class="sub-progress-track">
                <div class="sub-progress-fill" style="width:${subPercentage}%"></div>
              </div>
            </span>
          ` : ''}
          ${task.attachments && task.attachments.length > 0 ? `
            <span class="meta-tag">📎 ${task.attachments.length} files</span>
          ` : ''}
        </div>
        ${task.description ? `<div class="task-notes-block">${task.description}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="task-action-btn btn-focus" title="Lock into Warp Focus Mode">👁️</button>
        <button class="task-action-btn btn-edit" title="Configure settings">⚙️</button>
        <button class="task-action-btn btn-delete" title="Dissolve anomaly (Delete)">🗑️</button>
      </div>
    `;

    // --------------------------------------------------------------------------
    // CARD EVENT HANDLERS
    // --------------------------------------------------------------------------
    
    // Checkbox toggling with cosmic explosion
    const cb = card.querySelector('.task-cb-input');
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      const rect = cb.getBoundingClientRect();
      this.toggleTaskCompletion(task.id, rect.left + 10, rect.top + 10);
    });

    // Single click expands notes block
    card.addEventListener('click', (e) => {
      // Don't expand if clicking interactive buttons
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
      card.classList.toggle('expanded');
    });

    // Double click launches inline instant edit
    const titleSpan = card.querySelector('.task-title');
    titleSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.initiateInlineEdit(card, titleSpan, task.id);
    });

    // Action buttons click listeners
    card.querySelector('.btn-focus').addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterFocusMode(task);
    });

    card.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTaskModal(task);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTaskWithUndo(task.id);
    });

    return card;
  }

  // Inline instant edit block generator
  initiateInlineEdit(card, titleSpan, taskId) {
    const currentVal = titleSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentVal;
    input.className = 'inline-edit-input';
    input.style.width = '100%';
    input.style.background = 'rgba(0,0,0,0.4)';
    input.style.border = '1px solid var(--primary)';
    input.style.color = '#fff';
    input.style.padding = '4px 8px';
    input.style.borderRadius = '4px';
    
    titleSpan.replaceWith(input);
    input.focus();

    const saveInlineEdit = () => {
      const newVal = input.value.trim();
      if (newVal && newVal !== currentVal) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
          task.title = newVal;
          this.state.save();
          this.sounds.playChime();
        }
      }
      this.renderAll();
    };

    input.addEventListener('blur', saveInlineEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveInlineEdit();
      if (e.key === 'Escape') this.renderAll(); // Abort
    });
  }

  // --------------------------------------------------------------------------
  // TASK LIFECYCLE MANAGEMENT
  // --------------------------------------------------------------------------
  toggleTaskCompletion(id, cx, cy) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    
    if (task.completed) {
      // Trigger synthesis ping
      this.sounds.playChime();

      // Trigger starry explosion
      const cat = this.state.categories.find(c => c.id === task.categoryId) || { color: '#8b5cf6' };
      this.bg.triggerTaskImplosion(cx, cy, cat.color);

      // Reward Gold and XP based on priority
      const pRewards = { critical: 30, high: 20, medium: 15, low: 10 };
      const rewardVal = pRewards[task.priority] || 15;
      
      this.state.gold += rewardVal;
      this.state.addXP(rewardVal, () => this.sounds.playLevelUp());

      // Trigger achievement check
      this.checkAchievements();
      
      // Auto-regenerate if recurring task
      if (task.recurrence && task.recurrence !== 'none') {
        this.regenerateRecurringTask(task);
      }
    } else {
      // Deduct stats
      this.state.gold = Math.max(0, this.state.gold - 10);
      this.state.save();
    }

    setTimeout(() => {
      this.renderAll();
    }, 400); // short delay for visual blast transition
  }

  regenerateRecurringTask(task) {
    const nextTask = { ...task };
    nextTask.id = Date.now() + Math.floor(Math.random()*1000);
    nextTask.completed = false;
    nextTask.subtasks = task.subtasks ? task.subtasks.map(s => ({ ...s, completed: false })) : [];
    
    // Increment due date based on duration type
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (task.recurrence === 'daily') d.setDate(d.getDate() + 1);
      else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7);
      else if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (task.recurrence === 'yearly') d.setFullYear(d.getFullYear() + 1);
      nextTask.dueDate = d.toISOString().split('T')[0];
    }
    
    this.state.tasks.push(nextTask);
    this.state.save();
    this.showToast(`Recurring anomaly regenerated for orbit ${nextTask.dueDate || ''}`);
  }

  deleteTaskWithUndo(id) {
    const taskIndex = this.state.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const removedTask = this.state.tasks.splice(taskIndex, 1)[0];
    this.state.save();
    this.renderAll();

    // Dispatch Undo toast popup
    this.showToast(`Anomaly dissolved into stardust.`, () => {
      // Undo click logic
      this.state.tasks.splice(taskIndex, 0, removedTask);
      this.state.save();
      this.renderAll();
      this.sounds.playChime();
    });
  }

  // Toast creation
  showToast(message, undoCallback = null) {
    const container = document.getElementById('toast-wrapper');
    const toast = document.createElement('div');
    toast.className = `toast ${undoCallback ? 'toast-undo' : ''}`;
    
    toast.innerHTML = `
      <span>${message}</span>
      ${undoCallback ? `<button class="undo-btn">Undo (5s)</button>` : ''}
    `;

    if (undoCallback) {
      const undoBtn = toast.querySelector('.undo-btn');
      undoBtn.addEventListener('click', () => {
        undoCallback();
        toast.remove();
        clearTimeout(this.undoTimeoutId);
      });

      // Expire in 5 seconds
      this.undoTimeoutId = setTimeout(() => {
        toast.remove();
      }, 5000);
    } else {
      setTimeout(() => {
        toast.remove();
      }, 3500);
    }

    container.appendChild(toast);
  }

  // --------------------------------------------------------------------------
  // MODALS CONTROL & FILE BINDERS
  // --------------------------------------------------------------------------
  openTaskModal(taskToEdit = null, prefilledDate = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    form.reset();

    // Clear subtasks and attachments temporary displays
    document.getElementById('modal-subtasks-list').innerHTML = '';
    document.getElementById('modal-attachments-list').innerHTML = '';
    this.modalSubtasksTemp = [];
    this.modalAttachmentsTemp = [];

    const submitBtnSpan = document.getElementById('submit-task-btn').querySelector('span');
    const titleText = document.getElementById('modal-title-text');

    if (taskToEdit) {
      titleText.textContent = "Reconfigure Star Task";
      submitBtnSpan.textContent = "Update Cosmic Task";
      
      document.getElementById('edit-task-id').value = taskToEdit.id;
      document.getElementById('task-title-input').value = taskToEdit.title;
      document.getElementById('task-desc-input').value = taskToEdit.description || '';
      document.getElementById('task-category-select').value = taskToEdit.categoryId;
      document.getElementById('task-priority-select').value = taskToEdit.priority;
      document.getElementById('task-date-input').value = taskToEdit.dueDate || '';
      document.getElementById('task-time-input').value = taskToEdit.dueTime || '';
      document.getElementById('task-recurrence-select').value = taskToEdit.recurrence || 'none';

      // Load subtasks and attachments
      this.modalSubtasksTemp = taskToEdit.subtasks ? [...taskToEdit.subtasks] : [];
      this.modalAttachmentsTemp = taskToEdit.attachments ? [...taskToEdit.attachments] : [];
      this.renderModalSubtasks();
      this.renderModalAttachments();
    } else {
      titleText.textContent = "Construct Star Task";
      submitBtnSpan.textContent = "Initiate Star Task";
      document.getElementById('edit-task-id').value = '';
      if (prefilledDate) {
        document.getElementById('task-date-input').value = prefilledDate;
      }
    }

    modal.classList.remove('hidden');
    document.getElementById('task-title-input').focus();
  }

  closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
  }

  renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list');
    list.innerHTML = '';
    this.modalSubtasksTemp.forEach((s, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" ${s.completed ? 'checked' : ''} data-index="${idx}" class="sub-cb">
          <span style="${s.completed ? 'text-decoration:line-through; color:var(--text-muted)' : ''}">${s.title}</span>
        </span>
        <button type="button" class="icon-btn-small remove-sub" data-index="${idx}">×</button>
      `;
      list.appendChild(li);
    });
  }

  renderModalAttachments() {
    const list = document.getElementById('modal-attachments-list');
    list.innerHTML = '';
    this.modalAttachmentsTemp.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'attached-file-item';
      
      const isImg = file.data.startsWith('data:image/');
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          ${isImg ? `<img src="${file.data}" class="attachment-preview-img">` : '📄'}
          <span>${file.name}</span>
        </div>
        <button type="button" class="icon-btn-small remove-attachment" data-index="${idx}">×</button>
      `;
      list.appendChild(item);
    });
  }

  // Save new or modified task
  handleTaskFormSubmit(e) {
    e.preventDefault();

    const idVal = document.getElementById('edit-task-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const desc = document.getElementById('task-desc-input').value.trim();
    const categoryId = document.getElementById('task-category-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const dueDate = document.getElementById('task-date-input').value;
    const dueTime = document.getElementById('task-time-input').value;
    const recurrence = document.getElementById('task-recurrence-select').value;

    if (!title) return;

    if (idVal) {
      // Edit mode
      const task = this.state.tasks.find(t => t.id === parseInt(idVal));
      if (task) {
        task.title = title;
        task.description = desc;
        task.categoryId = categoryId;
        task.priority = priority;
        task.dueDate = dueDate;
        task.dueTime = dueTime;
        task.recurrence = recurrence;
        task.subtasks = this.modalSubtasksTemp;
        task.attachments = this.modalAttachmentsTemp;
      }
      this.showToast(`Stellar configuration updated.`);
    } else {
      // Create new
      const newTask = {
        id: Date.now(),
        title,
        description: desc,
        categoryId,
        priority,
        dueDate,
        dueTime,
        recurrence,
        completed: false,
        subtasks: this.modalSubtasksTemp,
        attachments: this.modalAttachmentsTemp,
        kanbanStatus: 'todo'
      };
      this.state.tasks.push(newTask);
      this.showToast(`New gravity node launched.`);
      
      // Earn XP for creation
      this.state.addXP(5, () => this.sounds.playLevelUp());
    }

    this.state.save();
    this.checkAchievements();
    this.closeTaskModal();
    this.renderAll();
  }

  // --------------------------------------------------------------------------
  // THEME CONTROL & BUILDER
  // --------------------------------------------------------------------------
  applyTheme(themeName) {
    // Clear theme body classes
    const classes = Array.from(document.body.classList).filter(c => c.startsWith('theme-'));
    classes.forEach(c => document.body.classList.remove(c));

    if (themeName !== 'cosmic') {
      document.body.classList.add(`theme-${themeName}`);
    }
    this.state.theme = themeName;
    this.state.save();
  }

  applyCustomTheme(primary, secondary, accent, opacity, intensity) {
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-glow', primary + '99');
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--secondary-glow', secondary + '66');
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-glow', accent + '99');
    document.documentElement.style.setProperty('--glass-blur', `${opacity * 100}px`);
    
    // Save settings
    this.state.customTheme = { primary, secondary, accent, opacity, intensity };
    this.state.theme = 'custom';
    this.state.save();
  }

  // --------------------------------------------------------------------------
  // POMODORO & FOCUS MODE CONTROL
  // --------------------------------------------------------------------------
  togglePomodoroTimer() {
    if (this.pomoState === 'running') {
      this.pausePomodoro();
    } else {
      this.startPomodoro();
    }
  }

  startPomodoro() {
    this.sounds.init();
    this.pomoState = 'running';
    document.getElementById('pomodoro-toggle').classList.add('timer-running');
    document.getElementById('focus-pomo-play').querySelector('span').textContent = 'Pause Timer';

    this.pomoTimerId = setInterval(() => {
      this.pomoRemaining -= 1;
      this.updatePomodoroDisplay();

      if (this.pomoRemaining <= 0) {
        this.triggerPomodoroAlarm();
      }
    }, 1000);
  }

  pausePomodoro() {
    this.pomoState = 'paused';
    document.getElementById('pomodoro-toggle').classList.remove('timer-running');
    document.getElementById('focus-pomo-play').querySelector('span').textContent = 'Resume Timer';
    clearInterval(this.pomoTimerId);
  }

  updatePomodoroDisplay() {
    const mins = Math.floor(this.pomoRemaining / 60);
    const secs = this.pomoRemaining % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    document.getElementById('pomo-hud-time').textContent = formatted;
    document.getElementById('focus-pomo-timer').textContent = formatted;

    // SVG clock radial stroke update
    const circle = document.getElementById('pomo-circle-progress');
    const circumference = 2 * Math.PI * 100; // r=100
    const percent = this.pomoRemaining / this.pomoDuration;
    circle.style.strokeDashoffset = circumference - (percent * circumference);
  }

  triggerPomodoroAlarm() {
    clearInterval(this.pomoTimerId);
    this.sounds.playLevelUp(); // Arpeggio fanfare
    this.showToast(`Focus session completed! Engage Warp recovery sequence.`);

    if (this.pomoType === 'focus') {
      // Swap to Break
      this.pomoType = 'shortBreak';
      this.pomoDuration = 5 * 60; // 5 min break
      this.pomoRemaining = 5 * 60;
      document.getElementById('focus-pomo-label').textContent = 'WARP RECOVERY';
      this.state.addXP(10, () => {});
      this.state.save();
    } else {
      // Swap to Focus
      this.pomoType = 'focus';
      this.pomoDuration = 25 * 60;
      this.pomoRemaining = 25 * 60;
      document.getElementById('focus-pomo-label').textContent = 'FOCUS SESSION';
    }

    this.pomoState = 'idle';
    this.updatePomodoroDisplay();
    document.getElementById('pomodoro-toggle').classList.remove('timer-running');
  }

  enterFocusMode(task = null) {
    const overlay = document.getElementById('focus-overlay');
    overlay.classList.remove('hidden');

    this.activeTaskForFocus = task || this.state.tasks.find(t => !t.completed) || null;
    
    const title = document.getElementById('focus-task-title');
    const desc = document.getElementById('focus-task-desc');
    const catSpan = document.getElementById('focus-task-category');

    if (this.activeTaskForFocus) {
      const cat = this.state.categories.find(c => c.id === this.activeTaskForFocus.categoryId) || { name: 'Space' };
      title.textContent = this.activeTaskForFocus.title;
      desc.textContent = this.activeTaskForFocus.description || 'No logs entered.';
      catSpan.textContent = cat.name.toUpperCase();
      document.getElementById('focus-task-complete-btn').classList.remove('hidden');
    } else {
      title.textContent = "Create orbital tasks to initiate warp core.";
      desc.textContent = "Focus systems are waiting.";
      catSpan.textContent = "IDLE";
      document.getElementById('focus-task-complete-btn').classList.add('hidden');
    }

    // Attempt layout transition full screen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } catch(e) {}
  }

  exitFocusMode() {
    document.getElementById('focus-overlay').classList.add('hidden');
    this.sounds.stopAmbient();
    
    // De-activate active focus selection buttons
    const activeBtn = document.querySelector('.focus-audio-selector .active');
    if (activeBtn) activeBtn.classList.remove('active');
    document.querySelector('.focus-audio-selector [data-sound="none"]').classList.add('active');

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch(e) {}
  }

  // --------------------------------------------------------------------------
  // CHRONOS HEATMAP GRID & DASHBOARD ANALYTICS
  // --------------------------------------------------------------------------
  renderDashboardStats() {
    const total = this.state.tasks.length;
    const completed = this.state.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Draw header counts
    document.getElementById('dash-success-rate').textContent = `${successRate}%`;
    document.getElementById('dash-completed-count').textContent = `${completed}/${total}`;

    // Draw detail lists
    document.getElementById('dash-matrix-score').textContent = Math.round(successRate * 10 + this.state.xp);
    document.getElementById('dash-matrix-streak').textContent = this.state.streak;
    document.getElementById('dash-matrix-total').textContent = total;
    document.getElementById('dash-matrix-active').textContent = active;

    // Draw Heatmap contributions SVG
    this.renderActivityHeatmap();

    // Render Category Radar Canvas Chart
    this.renderCategoryRadarChart();

    // Render achievements
    this.renderAchievementsTab();
  }

  renderActivityHeatmap() {
    const heatmap = document.getElementById('activity-heatmap');
    heatmap.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 520 80');
    svg.setAttribute('class', 'heatmap-svg');
    
    // Simulate columns of days representing past 52 weeks
    // We will build a matrix layout containing 7 rows by 52 columns
    const cols = 52;
    const rows = 7;
    const width = 8;
    const gap = 2;
    
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', c * (width + gap));
        rect.setAttribute('y', r * (width + gap));
        rect.setAttribute('width', width);
        rect.setAttribute('height', width);
        rect.setAttribute('rx', '1.5');
        
        // Random coloring based on simulated completion logs
        const weights = [0.05, 0.1, 0.2, 0.4, 0.65];
        const val = weights[Math.floor(Math.random() * weights.length)];
        rect.setAttribute('fill', `rgba(139, 92, 246, ${val})`);
        svg.appendChild(rect);
      }
    }
    
    heatmap.appendChild(svg);
  }

  renderCategoryRadarChart() {
    const canvas = document.getElementById('category-radar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,220,220);

    const categories = this.state.categories;
    const taskWeights = categories.map(cat => {
      return this.state.tasks.filter(t => t.categoryId === cat.id).length;
    });

    const maxWeight = Math.max(...taskWeights, 1);
    const center = 110;
    const maxRadius = 80;

    // Draw concentric HUD rings
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let radius = 20; radius <= maxRadius; radius += 20) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Calculate spokes
    const numSpokes = categories.length;
    const points = [];
    categories.forEach((cat, idx) => {
      const angle = (Math.PI * 2 / numSpokes) * idx - Math.PI / 2;
      const val = taskWeights[idx] || 0;
      const radius = (val / maxWeight) * maxRadius;
      
      const px = center + Math.cos(angle) * radius;
      const py = center + Math.sin(angle) * radius;
      points.push({x: px, y: py, color: cat.color});

      // Draw spoke axes lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(angle) * maxRadius, center + Math.sin(angle) * maxRadius);
      ctx.stroke();

      // Label text icons
      ctx.fillStyle = '#fff';
      ctx.font = '10px Space Grotesk';
      ctx.fillText(cat.icon, center + Math.cos(angle) * (maxRadius + 12) - 4, center + Math.sin(angle) * (maxRadius + 12) + 3);
    });

    // Draw inner connection polygon path
    if (points.length > 0) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.strokeStyle = 'var(--primary)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plot individual nodes
      points.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI*2);
        ctx.fill();
      });
    }
  }

  renderAchievementsTab() {
    const list = document.getElementById('achievements-container');
    list.innerHTML = '';

    const listDefinitions = [
      { id: 'first_task', name: 'First Orbit', desc: 'Construct first gravity node task.', icon: '🛰️' },
      { id: 'first_completion', name: 'Stellar Success', desc: 'Solidify first star (Complete task).', icon: '✨' },
      { id: 'streak_3', name: 'Chronos Cadet', desc: 'Maintain streak of 3 consecutive activity days.', icon: '🔋' },
      { id: 'streak_7', name: 'Space Explorer', desc: 'Maintain streak of 7 consecutive activity days.', icon: '🔥' },
      { id: 'gold_500', name: 'Aether Tycoon', desc: 'Accumulate 500 gold in your storage.', icon: '🪙' }
    ];

    listDefinitions.forEach(ach => {
      const isUnlocked = this.state.achievements.includes(ach.id);
      const item = document.createElement('div');
      item.className = `ach-item ${isUnlocked ? '' : 'locked'}`;
      item.innerHTML = `
        <span class="ach-icon">${ach.icon}</span>
        <div class="ach-info">
          <span class="ach-name">${ach.name}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // Achievement unlock logic
  checkAchievements() {
    const unlocked = this.state.achievements;
    
    // Definition criteria evaluation
    const checkAndUnlock = (id, conditionsSatisfied, name, desc) => {
      if (unlocked.includes(id)) return;
      if (conditionsSatisfied) {
        this.state.achievements.push(id);
        this.state.gold += 100;
        this.state.save();
        this.sounds.playAchievement();
        this.triggerAchievementPopup(name, desc);
      }
    };

    checkAndUnlock('first_task', this.state.tasks.length >= 1, 'First Orbit', 'Successfully added first star task node.');
    checkAndUnlock('first_completion', this.state.tasks.some(t => t.completed), 'Stellar Success', 'Completed first celestial milestone.');
    checkAndUnlock('streak_3', this.state.streak >= 3, 'Chronos Cadet', 'Completed tasks on 3 consecutive days.');
    checkAndUnlock('streak_7', this.state.streak >= 7, 'Space Explorer', 'Completed tasks on 7 consecutive days.');
    checkAndUnlock('gold_500', this.state.gold >= 500, 'Aether Tycoon', 'Collected 500 Aether Gold.');
  }

  triggerAchievementPopup(name, desc) {
    const popup = document.getElementById('achievement-celebration');
    document.getElementById('ach-popup-name').innerText = name;
    document.getElementById('ach-popup-desc').innerText = desc;
    popup.classList.remove('hidden');
    setTimeout(() => {
      popup.classList.add('hidden');
    }, 5000);
  }

  // --------------------------------------------------------------------------
  // STORE / SHOP ITEMS AND UNLOCK CODES
  // --------------------------------------------------------------------------
  renderStoreModal() {
    const cont = document.getElementById('shop-items-container');
    cont.innerHTML = '';

    const items = [
      { id: 'theme-cyberpunk', title: 'Neon Cyberpunk Theme', type: 'theme', price: 200, icon: '⚡', desc: 'Glitch grids, high-contrast cyan, and hot magenta overrides.' },
      { id: 'theme-aurora', title: 'Aurora Borealis Theme', type: 'theme', price: 150, icon: '🌌', desc: 'Sage greens and drifting solar storm particles.' },
      { id: 'theme-sunset', title: 'Sunset Flare Theme', type: 'theme', price: 100, icon: '🔥', desc: 'Warm gradients and crimson orbit interfaces.' },
      { id: 'theme-forest', title: 'Greenwood Forest Theme', type: 'theme', price: 100, icon: '🌲', desc: 'Organic emerald panels and velvet dark lines.' },
      { id: 'theme-matrix', title: 'Matrix Green Theme', type: 'theme', price: 250, icon: '💻', desc: 'Retro monochrome terminal aesthetic with grid filters.' },
      { id: 'theme-amoled', title: 'AMOLED Black Theme', type: 'theme', price: 50, icon: '🌑', desc: 'Ultra-dark pure black theme to save device battery energy.' }
    ];

    items.forEach(it => {
      const isOwned = this.state.unlockedThemes.includes(it.id.replace('theme-', ''));
      const card = document.createElement('div');
      card.className = 'shop-card';
      
      card.innerHTML = `
        <div class="shop-card-icon">${it.icon}</div>
        <div class="shop-card-title">${it.title}</div>
        <div class="shop-card-desc">${it.desc}</div>
        <div class="shop-card-footer">
          <span class="shop-price">${isOwned ? 'OWNED' : `🪙 ${it.price}g`}</span>
          <button class="primary-btn shop-buy-btn" ${isOwned ? 'disabled' : ''} data-item="${it.id}" data-price="${it.price}">
            <span>${isOwned ? 'Unlocked' : 'Acquire'}</span>
          </button>
        </div>
      `;

      // Acquire purchase event
      if (!isOwned) {
        card.querySelector('.shop-buy-btn').addEventListener('click', (e) => {
          this.handleStorePurchase(it.id, it.price);
        });
      }

      cont.appendChild(card);
    });
  }

  handleStorePurchase(itemId, price) {
    if (this.state.gold < price) {
      this.showToast(`Insufficient Aether Gold. Complete more orbits!`);
      return;
    }

    this.state.gold -= price;
    const idKey = itemId.replace('theme-', '');
    this.state.unlockedThemes.push(idKey);
    this.state.save();
    
    this.sounds.playLevelUp(); // Purchase chime
    this.showToast(`Item unlocked: ${itemId.toUpperCase()}`);
    this.renderSidebarStats();
    this.renderStoreModal();
    this.renderThemeModal(); // Update presets lists
  }

  renderThemeModal() {
    const list = document.getElementById('theme-presets-list');
    list.innerHTML = '';

    const allThemes = [
      { id: 'cosmic', name: 'Cosmic Dark', color: '#8b5cf6' },
      { id: 'cyberpunk', name: 'Cyberpunk Grid', color: '#ff007f' },
      { id: 'aurora', name: 'Aurora Forest', color: '#14b8a6' },
      { id: 'ocean', name: 'Deep Ocean', color: '#0ea5e9' },
      { id: 'sunset', name: 'Sunset Flare', color: '#f43f5e' },
      { id: 'forest', name: 'Greenwood', color: '#059669' },
      { id: 'minimal', name: 'Minimal White', color: '#64748b' },
      { id: 'amoled', name: 'AMOLED Black', color: '#ffffff' },
      { id: 'purple', name: 'Royal Purple', color: '#a855f7' },
      { id: 'matrix', name: 'Matrix Green', color: '#00ff00' }
    ];

    allThemes.forEach(th => {
      const isUnlocked = this.state.unlockedThemes.includes(th.id);
      
      const btn = document.createElement('button');
      btn.className = `preset-theme-btn`;
      btn.style.setProperty('--theme-dot-primary', th.color);
      btn.style.setProperty('--theme-dot-glow', th.color + '88');
      
      btn.innerHTML = `
        <span class="theme-dot"></span>
        <span>${th.name}</span>
        ${isUnlocked ? '' : '🔒'}
      `;

      if (isUnlocked) {
        btn.addEventListener('click', () => {
          this.applyTheme(th.id);
          this.showToast(`Switched sector timeline to: ${th.name}`);
        });
      } else {
        btn.addEventListener('click', () => {
          this.showToast(`Unlock this layout presets inside the Aether Gold Store first!`);
        });
      }

      list.appendChild(btn);
    });
  }

  // --------------------------------------------------------------------------
  // 5. EVENT BINDINGS SYSTEM
  // --------------------------------------------------------------------------
  initEvents() {
    const self = this;

    // Load any custom colors initially
    if (this.state.theme === 'custom' && this.state.customTheme) {
      const c = this.state.customTheme;
      this.applyCustomTheme(c.primary, c.secondary, c.accent, c.opacity, c.intensity);
    } else {
      this.applyTheme(this.state.theme);
    }

    // --------------------------------------------------------------------------
    // DYNAMIC VIEWS SWITCHERS
    // --------------------------------------------------------------------------
    const viewButtons = document.querySelectorAll('.nav-links button, .aether-deck-mobile-nav button');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const viewName = btn.getAttribute('data-view');
        
        // Hide all views first
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(`view-${viewName}`).classList.remove('hidden');

        self.currentView = viewName;
        self.renderAll();
      });
    });

    // --------------------------------------------------------------------------
    // MAIN TASK MODAL ACTION TRIGGERS
    // --------------------------------------------------------------------------
    const creators = document.querySelectorAll('.launch-task-creator');
    creators.forEach(btn => {
      btn.addEventListener('click', () => self.openTaskModal());
    });

    document.getElementById('close-task-modal-btn').addEventListener('click', () => self.closeTaskModal());
    document.getElementById('cancel-task-btn').addEventListener('click', () => self.closeTaskModal());
    document.getElementById('task-form').addEventListener('submit', (e) => self.handleTaskFormSubmit(e));

    // Dynamic Category Creation
    document.getElementById('add-cat-btn').addEventListener('click', () => {
      document.getElementById('category-modal').classList.remove('hidden');
      document.getElementById('cat-name-input').focus();
    });

    document.getElementById('close-category-modal-btn').addEventListener('click', () => {
      document.getElementById('category-modal').classList.add('hidden');
    });
    document.getElementById('cancel-cat-btn').addEventListener('click', () => {
      document.getElementById('category-modal').classList.add('hidden');
    });

    document.getElementById('category-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cat-name-input').value.trim();
      const icon = document.getElementById('cat-icon-select').value;
      const color = document.getElementById('cat-color-input').value;

      if (!name) return;

      const newCat = {
        id: 'cat_' + Date.now(),
        name,
        icon,
        color
      };

      self.state.categories.push(newCat);
      self.state.save();
      self.showToast(`Custom category orbit formulated.`);
      
      document.getElementById('category-modal').classList.add('hidden');
      document.getElementById('category-form').reset();
      
      self.renderAll();
    });

    // Subtask lists creation handling inside task modal
    document.getElementById('add-subtask-btn').addEventListener('click', () => {
      const input = document.getElementById('new-subtask-input');
      const val = input.value.trim();
      if (!val) return;

      self.modalSubtasksTemp.push({
        id: Date.now() + Math.random(),
        title: val,
        completed: false
      });
      input.value = '';
      self.renderModalSubtasks();
    });

    document.getElementById('modal-subtasks-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-sub')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        self.modalSubtasksTemp.splice(idx, 1);
        self.renderModalSubtasks();
      } else if (e.target.classList.contains('sub-cb')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        self.modalSubtasksTemp[idx].completed = e.target.checked;
        self.renderModalSubtasks();
      }
    });

    // File reference base64 loader implementation
    document.getElementById('task-attachment-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        self.modalAttachmentsTemp.push({
          name: file.name,
          data: evt.target.result // Base64 encoding
        });
        self.renderModalAttachments();
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('modal-attachments-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-attachment')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        self.modalAttachmentsTemp.splice(idx, 1);
        self.renderModalAttachments();
      }
    });

    // Category filter binder
    document.getElementById('sidebar-categories').addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-filter-btn');
      if (!btn) return;
      
      self.activeFilterCategory = btn.getAttribute('data-cat');
      self.renderAll();
    });

    // Search and Sorting debounce binds
    let searchDebounceId;
    document.getElementById('search-input').addEventListener('input', () => {
      clearTimeout(searchDebounceId);
      searchDebounceId = setTimeout(() => {
        self.renderAll();
      }, 250);
    });

    document.getElementById('sort-select').addEventListener('change', () => {
      self.renderAll();
    });

    // --------------------------------------------------------------------------
    // THEME CUSTOMIZER TRIGGERS
    // --------------------------------------------------------------------------
    document.getElementById('open-theme-btn').addEventListener('click', () => {
      self.renderThemeModal();
      document.getElementById('theme-modal').classList.remove('hidden');
    });

    document.getElementById('close-theme-modal-btn').addEventListener('click', () => {
      document.getElementById('theme-modal').classList.add('hidden');
    });

    document.getElementById('apply-custom-theme-btn').addEventListener('click', () => {
      const pri = document.getElementById('custom-theme-primary').value;
      const sec = document.getElementById('custom-theme-secondary').value;
      const acc = document.getElementById('custom-theme-accent').value;
      const op = parseFloat(document.getElementById('custom-theme-opacity').value);
      const intensity = parseFloat(document.getElementById('custom-theme-intensity').value);

      self.applyCustomTheme(pri, sec, acc, op, intensity);
      self.showToast(`Custom solar colors injected.`);
      document.getElementById('theme-modal').classList.add('hidden');
    });

    // Auto-detect system Dark/Light mode theme updates
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (self.state.theme === 'cosmic' || self.state.theme === 'minimal') {
        const newTheme = event.matches ? 'cosmic' : 'minimal';
        self.applyTheme(newTheme);
      }
    });

    // --------------------------------------------------------------------------
    // STORES SHOP BINDERS
    // --------------------------------------------------------------------------
    document.getElementById('open-shop-btn').addEventListener('click', () => {
      self.renderStoreModal();
      document.getElementById('shop-modal').classList.remove('hidden');
    });

    document.getElementById('close-shop-modal-btn').addEventListener('click', () => {
      document.getElementById('shop-modal').classList.add('hidden');
    });

    // Global volume mute switcher
    document.getElementById('toggle-audio-btn').addEventListener('click', (e) => {
      const btn = e.target.closest('#toggle-audio-btn');
      const isMuted = self.sounds.toggleMute();
      self.state.soundActive = !isMuted;
      self.state.save();

      if (isMuted) {
        btn.classList.remove('sound-active');
        document.getElementById('sound-icon').innerText = '🔇';
      } else {
        btn.classList.add('sound-active');
        document.getElementById('sound-icon').innerText = '🔊';
        self.sounds.playChime();
      }
    });

    // --------------------------------------------------------------------------
    // DRAG AND DROP KANBAN EVENTS
    // --------------------------------------------------------------------------
    const dropzones = document.querySelectorAll('.kanban-dropzone');
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        
        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
        const newStatus = zone.parentElement.getAttribute('data-status');
        
        const task = self.state.tasks.find(t => t.id === taskId);
        if (task) {
          if (newStatus === 'done') {
            const rect = zone.getBoundingClientRect();
            self.toggleTaskCompletion(taskId, rect.left + 50, rect.top + 50);
          } else {
            task.kanbanStatus = newStatus;
            task.completed = false; // reset completion if dragging back to active
            self.state.save();
            self.sounds.playChime();
            self.renderAll();
          }
        }
      });
    });

    // --------------------------------------------------------------------------
    // FOCUS AND POMODORO ACTION BINDERS
    // --------------------------------------------------------------------------
    document.getElementById('pomodoro-toggle').addEventListener('click', () => {
      self.enterFocusMode(self.activeTaskForFocus);
    });

    document.getElementById('focus-mode-toggle').addEventListener('click', () => {
      self.enterFocusMode();
    });

    document.getElementById('focus-mode-exit').addEventListener('click', () => {
      self.exitFocusMode();
    });

    document.getElementById('focus-pomo-play').addEventListener('click', () => {
      self.togglePomodoroTimer();
    });

    document.getElementById('focus-task-complete-btn').addEventListener('click', () => {
      if (self.activeTaskForFocus) {
        const btn = document.getElementById('focus-task-complete-btn');
        const rect = btn.getBoundingClientRect();
        self.toggleTaskCompletion(self.activeTaskForFocus.id, rect.left, rect.top);
        self.exitFocusMode();
      }
    });

    // Focus mode ambient sound generators triggers
    const audioSelectBtns = document.querySelectorAll('.focus-audio-selector button');
    audioSelectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioSelectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const soundType = btn.getAttribute('data-sound');
        self.sounds.playAmbient(soundType);
      });
    });

    // --------------------------------------------------------------------------
    // KEYBOARD COMMAND HUD SHORTCUTS (⌘K / ESCAPE)
    // --------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K Focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }

      // Escape key closes modals
      if (e.key === 'Escape') {
        self.closeTaskModal();
        document.getElementById('category-modal').classList.add('hidden');
        document.getElementById('theme-modal').classList.add('hidden');
        document.getElementById('shop-modal').classList.add('hidden');
        self.exitFocusMode();
      }
    });

    // Calendar view navigation
    document.getElementById('cal-prev-month').addEventListener('click', () => {
      self.calendarCurrentDate.setMonth(self.calendarCurrentDate.getMonth() - 1);
      self.renderCalendarView();
    });

    document.getElementById('cal-next-month').addEventListener('click', () => {
      self.calendarCurrentDate.setMonth(self.calendarCurrentDate.getMonth() + 1);
      self.renderCalendarView();
    });

    // Dashboard drawer expandable control
    document.getElementById('dashboard-toggle-trigger').addEventListener('click', () => {
      const panel = document.getElementById('dashboard-drawer-panel');
      const drawer = document.querySelector('.hud-dashboard-drawer');
      
      panel.classList.toggle('hidden');
      drawer.classList.toggle('open');
    });

    // --------------------------------------------------------------------------
    // CURSOR TRACKING MATRIX & DEPTH SHADOWS
    // --------------------------------------------------------------------------
    const cursor = document.getElementById('custom-cursor');
    const glow = document.getElementById('custom-cursor-glow');
    
    window.addEventListener('mousemove', (e) => {
      // Shift CSS coordinate markers
      document.documentElement.style.setProperty('--cursor-x', `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty('--cursor-y', `${(e.clientY / window.innerHeight) * 100}%`);

      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      
      // Outer glow follows with slight mechanical delay (interpolate)
      glow.animate({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`
      }, { duration: 150, fill: 'forwards' });
    });

    // Glow expansion on hover links
    const interactiveElements = 'a, button, select, input, textarea, .task-card, .task-cb-custom, option';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveElements)) {
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveElements)) {
        document.body.classList.remove('cursor-hover');
      }
    });
  }
}

// --------------------------------------------------------------------------
// INITIALIZE SYSTEM OS INSTANCE
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const App = new TaskGalaxyApp();
  App.run();
});
