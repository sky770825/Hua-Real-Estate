// 手機遊戲引擎 - 專為觸控設計的遊戲
class MobileGameEngine {
  constructor() {
    this.currentGame = null;
    this.gameStates = {};
    this.vibrateSupported = 'vibrate' in navigator;
    this.touchEvents = {};
    this.initTouchEvents();
  }

  initTouchEvents() {
    // 防止觸控時的默認行為
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('.game-area') || e.target.closest('.game-icon-btn')) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.game-area')) {
        e.preventDefault();
      }
    }, { passive: false });

    // 防止雙擊縮放
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('.game-area') || e.target.closest('.game-icon-btn')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  vibrate(pattern = [100]) {
    try {
      if (this.vibrateSupported) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // 震動功能失敗時靜默處理
      console.log('震動功能失敗:', error);
    }
  }

  playSound(type) {
    try {
      // 優化的音效系統 - 使用 Web Audio API 池化
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // 如果音頻上下文被暫停，恢復它
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      let frequency = 440;
      switch(type) {
        case 'click': frequency = 800; break;
        case 'success': frequency = 600; break;
        case 'error': frequency = 300; break;
        case 'win': frequency = 1000; break;
      }
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime); // 降低音量
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.08);
    } catch (error) {
      // 音效播放失敗時靜默處理
      console.log('音效播放失敗:', error);
    }
  }

  showToast(message, type = 'info') {
    // 優化 Toast 顯示 - 避免重複創建
    const existingToast = document.querySelector('.game-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `game-toast fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 will-change-transform`;
    
    switch(type) {
      case 'success': toast.className += ' bg-green-500'; break;
      case 'error': toast.className += ' bg-red-500'; break;
      case 'warning': toast.className += ' bg-yellow-500'; break;
      default: toast.className += ' bg-blue-500'; break;
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 使用 requestAnimationFrame 優化動畫
    requestAnimationFrame(() => {
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 200);
      }, 1500);
    });
  }
}

// 翻轉卡片記憶遊戲 - 手機優化版
class MobileMemoryGame {
  constructor() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.timeLeft = 90; // 增加時間
    this.timer = null;
    this.gameStarted = false;
    this.moves = 0;
  }

  init() {
    this.createCards();
    this.render();
    this.startTimer();
  }

  createCards() {
    const symbols = ['🏠', '💰', '🚗', '🏆', '🎯', '⭐', '🎮', '🎨'];
    this.cards = [];
    
    symbols.forEach((symbol, index) => {
      this.cards.push({ id: index * 2, symbol: symbol, flipped: false, matched: false });
      this.cards.push({ id: index * 2 + 1, symbol: symbol, flipped: false, matched: false });
    });
    
    this.cards = this.shuffleArray(this.cards);
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  render() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;

    // 使用 DocumentFragment 提高性能
    const fragment = document.createDocumentFragment();
    grid.innerHTML = '';
    grid.className = 'grid grid-cols-4 gap-0 w-full h-full';
    
    this.cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'aspect-square bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-transform duration-200 touch-manipulation will-change-transform';
      
      if (card.flipped) {
        cardElement.innerHTML = card.symbol;
        cardElement.className += ' bg-gradient-to-br from-yellow-400 to-orange-500 scale-105 shadow-lg';
      } else if (card.matched) {
        cardElement.innerHTML = card.symbol;
        cardElement.className += ' bg-gradient-to-br from-green-400 to-green-600 opacity-75';
      } else {
        cardElement.innerHTML = '❓';
        cardElement.className += ' hover:scale-105 active:scale-95';
      }
      
      // 使用事件委託提高性能
      cardElement.dataset.index = index;
      
      // 觸控事件
      cardElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.flipCard(index);
      }, { passive: false });
      
      // 點擊事件
      cardElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.flipCard(index);
      });
      
      fragment.appendChild(cardElement);
    });

    grid.appendChild(fragment);
    this.updateUI();
  }

  flipCard(index) {
    if (!this.gameStarted) {
      this.gameStarted = true;
    }

    const card = this.cards[index];
    if (card.flipped || card.matched || this.flippedCards.length >= 2) return;

    card.flipped = true;
    this.flippedCards.push({ index, card });
    this.moves++;
    
    // 使用 requestAnimationFrame 優化渲染
    requestAnimationFrame(() => {
      this.render();
    });
    
    gameEngine.playSound('click');
    gameEngine.vibrate([50]);

    if (this.flippedCards.length === 2) {
      setTimeout(() => this.checkMatch(), 1000); // 減少等待時間
    }
  }

  checkMatch() {
    const [first, second] = this.flippedCards;
    
    if (first.card.symbol === second.card.symbol) {
      first.card.matched = true;
      second.card.matched = true;
      this.matchedPairs++;
      this.score += 20;
      gameEngine.playSound('success');
      gameEngine.vibrate([100, 50, 100]);
      gameEngine.showToast('配對成功！', 'success');
      
      if (this.matchedPairs === 8) {
        this.gameWin();
      }
    } else {
      first.card.flipped = false;
      second.card.flipped = false;
      gameEngine.playSound('error');
      gameEngine.vibrate([200]);
    }
    
    this.flippedCards = [];
    
    // 使用 requestAnimationFrame 優化渲染
    requestAnimationFrame(() => {
      this.render();
      this.updateUI();
    });
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      // 使用 requestAnimationFrame 優化 UI 更新
      requestAnimationFrame(() => {
        this.updateUI();
      });
      
      if (this.timeLeft <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  updateUI() {
    document.getElementById('memoryScore').textContent = this.score;
    document.getElementById('memoryTime').textContent = this.timeLeft;
    document.getElementById('memoryMoves').textContent = this.moves;
  }

  gameWin() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.score += this.timeLeft * 5 + (20 - this.moves) * 10;
    this.updateUI();
    gameEngine.playSound('win');
    gameEngine.vibrate([100, 50, 100, 50, 200]);
    gameEngine.showToast(`恭喜完成！分數: ${this.score}`, 'success');
    setTimeout(() => {
      updateScore('memory', this.score);
      closeGame();
    }, 2000);
  }

  gameOver() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`時間到！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('memory', this.score);
      closeGame();
    }, 2000);
  }
}

// 滑動消除遊戲 - 全新手機遊戲
class SwipeEliminateGame {
  constructor() {
    this.grid = [];
    this.size = 6;
    this.score = 0;
    this.moves = 30;
    this.targetScore = 1000;
    this.gameStarted = false;
    this.selectedTile = null;
    this.touchStartPos = null;
  }

  init() {
    this.createGrid();
    this.render();
  }

  createGrid() {
    this.grid = [];
    const colors = ['🔴', '🟡', '🔵', '🟢', '🟣', '🟠'];
    
    for (let i = 0; i < this.size; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.size; j++) {
        this.grid[i][j] = {
          color: colors[Math.floor(Math.random() * colors.length)],
          matched: false
        };
      }
    }
    
    this.removeMatches();
  }

  render() {
    const grid = document.getElementById('eliminateGrid');
    if (!grid) return;

    // 使用 DocumentFragment 提高性能
    const fragment = document.createDocumentFragment();
    grid.innerHTML = '';
    grid.className = 'grid grid-cols-6 gap-0 w-full h-full';
    
    this.grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-transform duration-150 touch-manipulation will-change-transform';
        
        if (!tile.matched) {
          tileElement.innerHTML = tile.color;
          tileElement.className += ' hover:scale-105 active:scale-95';
          
          // 使用數據屬性存儲位置信息
          tileElement.dataset.row = rowIndex;
          tileElement.dataset.col = colIndex;
          
          // 觸控事件
          tileElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchStart(e, rowIndex, colIndex);
          }, { passive: false });
          
          tileElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleTouchEnd(e, rowIndex, colIndex);
          }, { passive: false });
          
          tileElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectTile(rowIndex, colIndex);
          });
        } else {
          tileElement.className += ' bg-gray-100 opacity-50';
        }
        
        fragment.appendChild(tileElement);
      });
    });

    grid.appendChild(fragment);
    this.updateUI();
  }

  handleTouchStart(e, row, col) {
    e.preventDefault();
    this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    this.selectTile(row, col);
  }

  handleTouchEnd(e, row, col) {
    e.preventDefault();
    if (!this.touchStartPos) return;
    
    const touchEndPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const deltaX = touchEndPos.x - this.touchStartPos.x;
    const deltaY = touchEndPos.y - this.touchStartPos.y;
    
    // 降低滑動閾值，提高響應性
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      this.handleSwipe(row, col, deltaX, deltaY);
    }
    
    this.touchStartPos = null;
  }

  handleSwipe(row, col, deltaX, deltaY) {
    let newRow = row;
    let newCol = col;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑動
      newCol += deltaX > 0 ? 1 : -1;
    } else {
      // 垂直滑動
      newRow += deltaY > 0 ? 1 : -1;
    }
    
    if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
      this.swapTiles(row, col, newRow, newCol);
    }
  }

  selectTile(row, col) {
    if (this.grid[row][col].matched) return;
    
    if (this.selectedTile) {
      if (this.selectedTile.row === row && this.selectedTile.col === col) {
        this.selectedTile = null;
      } else if (this.isAdjacent(this.selectedTile, { row, col })) {
        this.swapTiles(this.selectedTile.row, this.selectedTile.col, row, col);
        this.selectedTile = null;
      } else {
        this.selectedTile = { row, col };
      }
    } else {
      this.selectedTile = { row, col };
    }
    
    // 使用 requestAnimationFrame 優化渲染
    requestAnimationFrame(() => {
      this.render();
    });
  }

  isAdjacent(tile1, tile2) {
    const rowDiff = Math.abs(tile1.row - tile2.row);
    const colDiff = Math.abs(tile1.col - tile2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  swapTiles(row1, col1, row2, col2) {
    [this.grid[row1][col1], this.grid[row2][col2]] = [this.grid[row2][col2], this.grid[row1][col1]];
    
    if (this.gameStarted) {
      this.moves--;
    } else {
      this.gameStarted = true;
    }
    
    const matches = this.findMatches();
    if (matches.length > 0) {
      this.removeMatches();
      this.score += matches.length * 10;
      gameEngine.playSound('success');
      gameEngine.vibrate([100]);
      gameEngine.showToast(`消除 ${matches.length} 個！`, 'success');
    } else {
      // 如果沒有匹配，交換回來
      [this.grid[row1][col1], this.grid[row2][col2]] = [this.grid[row2][col2], this.grid[row1][col1]];
      gameEngine.playSound('error');
      gameEngine.vibrate([200]);
    }
    
    // 使用 requestAnimationFrame 優化渲染
    requestAnimationFrame(() => {
      this.render();
    });
    
    if (this.score >= this.targetScore) {
      this.gameWin();
    } else if (this.moves <= 0) {
      this.gameOver();
    }
  }

  findMatches() {
    const matches = [];
    
    // 檢查水平匹配
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size - 2; j++) {
        if (this.grid[i][j].color === this.grid[i][j+1].color && 
            this.grid[i][j].color === this.grid[i][j+2].color) {
          matches.push({ row: i, col: j, type: 'horizontal', length: 3 });
        }
      }
    }
    
    // 檢查垂直匹配
    for (let i = 0; i < this.size - 2; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j].color === this.grid[i+1][j].color && 
            this.grid[i][j].color === this.grid[i+2][j].color) {
          matches.push({ row: i, col: j, type: 'vertical', length: 3 });
        }
      }
    }
    
    return matches;
  }

  removeMatches() {
    const matches = this.findMatches();
    matches.forEach(match => {
      for (let i = 0; i < match.length; i++) {
        if (match.type === 'horizontal') {
          this.grid[match.row][match.col + i].matched = true;
        } else {
          this.grid[match.row + i][match.col].matched = true;
        }
      }
    });
    
    // 掉落新方塊
    this.dropNewTiles();
  }

  dropNewTiles() {
    const colors = ['🔴', '🟡', '🔵', '🟢', '🟣', '🟠'];
    
    for (let col = 0; col < this.size; col++) {
      // 移動已匹配的方塊到頂部
      const column = [];
      for (let row = 0; row < this.size; row++) {
        if (!this.grid[row][col].matched) {
          column.push(this.grid[row][col]);
        }
      }
      
      // 填充新方塊
      while (column.length < this.size) {
        column.unshift({
          color: colors[Math.floor(Math.random() * colors.length)],
          matched: false
        });
      }
      
      // 更新列
      for (let row = 0; row < this.size; row++) {
        this.grid[row][col] = column[row];
      }
    }
  }

  updateUI() {
    document.getElementById('eliminateScore').textContent = this.score;
    document.getElementById('eliminateMoves').textContent = this.moves;
    document.getElementById('eliminateTarget').textContent = this.targetScore;
  }

  gameWin() {
    gameEngine.playSound('win');
    gameEngine.vibrate([100, 50, 100, 50, 200]);
    gameEngine.showToast(`恭喜達成目標！分數: ${this.score}`, 'success');
    setTimeout(() => {
      updateScore('eliminate', this.score);
      closeGame();
    }, 1500); // 減少等待時間
  }

  gameOver() {
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`步數用完！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('eliminate', this.score);
      closeGame();
    }, 1500); // 減少等待時間
  }
}

// 點擊反應遊戲 - 測試反應速度
class ReactionGame {
  constructor() {
    this.score = 0;
    this.round = 0;
    this.maxRounds = 10;
    this.reactionTimes = [];
    this.gameStarted = false;
    this.waitingForClick = false;
    this.startTime = 0;
    this.timeoutId = null;
  }

  init() {
    this.render();
    this.startRound();
  }

  render() {
    const gameArea = document.getElementById('reactionArea');
    if (!gameArea) return;

    gameArea.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">🎯</div>
        <div id="reactionMessage" class="text-2xl font-bold mb-4">準備開始</div>
        <div id="reactionButton" class="w-32 h-32 mx-auto rounded-full bg-red-500 cursor-pointer transition-all duration-300 touch-manipulation"></div>
        <div class="mt-4 text-sm text-gray-600">
          回合: <span id="reactionRound">0</span>/10 | 
          平均反應: <span id="reactionAvg">0</span>ms
        </div>
      </div>
    `;

    const button = document.getElementById('reactionButton');
    if (button) {
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleClick();
      }, { passive: false });
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleClick();
      });
    }
  }

  startRound() {
    if (this.round >= this.maxRounds) {
      this.gameEnd();
      return;
    }

    this.round++;
    this.waitingForClick = false;
    this.updateUI();

    // 顯示等待訊息
    document.getElementById('reactionMessage').textContent = '等待綠色...';
    document.getElementById('reactionButton').className = 'w-32 h-32 mx-auto rounded-full bg-red-500 cursor-pointer transition-all duration-300 touch-manipulation';

    // 隨機等待時間 (1-4秒)
    const waitTime = 1000 + Math.random() * 3000;
    
    setTimeout(() => {
      if (!this.gameStarted) {
        this.gameStarted = true;
      }
      
      this.waitingForClick = true;
      document.getElementById('reactionMessage').textContent = '點擊！';
      document.getElementById('reactionButton').className = 'w-32 h-32 mx-auto rounded-full bg-green-500 cursor-pointer transition-all duration-300 touch-manipulation animate-pulse';
      this.startTime = Date.now();
      
      // 如果5秒內沒點擊，自動結束回合
      this.timeoutId = setTimeout(() => {
        this.endRound(false);
      }, 5000);
      
    }, waitTime);
  }

  handleClick() {
    if (!this.waitingForClick) {
      gameEngine.playSound('error');
      gameEngine.vibrate([200]);
      gameEngine.showToast('太快了！等綠色再點擊', 'error');
      return;
    }

    const reactionTime = Date.now() - this.startTime;
    this.endRound(true, reactionTime);
  }

  endRound(success, reactionTime = 0) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.waitingForClick = false;
    
    if (success && reactionTime > 0) {
      this.reactionTimes.push(reactionTime);
      this.score += Math.max(0, 1000 - reactionTime);
      
      gameEngine.playSound('success');
      gameEngine.vibrate([50]);
      gameEngine.showToast(`反應時間: ${reactionTime}ms`, 'success');
      
      document.getElementById('reactionButton').className = 'w-32 h-32 mx-auto rounded-full bg-blue-500 cursor-pointer transition-all duration-300 touch-manipulation';
    } else {
      gameEngine.playSound('error');
      gameEngine.vibrate([300]);
      gameEngine.showToast('失敗！', 'error');
      
      document.getElementById('reactionButton').className = 'w-32 h-32 mx-auto rounded-full bg-red-500 cursor-pointer transition-all duration-300 touch-manipulation';
    }

    this.updateUI();
    
    setTimeout(() => {
      this.startRound();
    }, 1000); // 減少等待時間
  }

  updateUI() {
    document.getElementById('reactionRound').textContent = this.round;
    
    if (this.reactionTimes.length > 0) {
      const avg = Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
      document.getElementById('reactionAvg').textContent = avg;
    }
  }

  gameEnd() {
    const avgReaction = this.reactionTimes.length > 0 ? 
      Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length) : 0;
    
    gameEngine.playSound('win');
    gameEngine.vibrate([100, 50, 100, 50, 200]);
    gameEngine.showToast(`遊戲結束！平均反應: ${avgReaction}ms`, 'success');
    
    setTimeout(() => {
      updateScore('reaction', this.score);
      closeGame();
    }, 1500); // 減少等待時間
  }
}

// 簡單的數字合併遊戲 - 手機優化版
class SimpleMergeGame {
  constructor() {
    this.grid = [];
    this.size = 4;
    this.score = 0;
    this.gameOver = false;
    this.won = false;
  }

  init() {
    this.createGrid();
    this.addRandomTile();
    this.addRandomTile();
    this.render();
    this.setupSwipeControls();
  }

  createGrid() {
    this.grid = [];
    for (let i = 0; i < this.size; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.size; j++) {
        this.grid[i][j] = 0;
      }
    }
  }

  addRandomTile() {
    const emptyCells = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  setupSwipeControls() {
    const gameArea = document.getElementById('mergeArea');
    const gameGrid = document.getElementById('mergeGrid');
    
    if (!gameArea && !gameGrid) return;

    let startX, startY, endX, endY;

    const handleTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // 降低滑動閾值，提高響應性
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑動
        if (Math.abs(deltaX) > 30) {
          this.move(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // 垂直滑動
        if (Math.abs(deltaY) > 30) {
          this.move(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    // 為遊戲區域和網格都添加觸控事件
    if (gameArea) {
      gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    if (gameGrid) {
      gameGrid.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameGrid.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // 添加鍵盤控制
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.move('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.move('right');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          this.restart();
          break;
      }
    });
  }

  render() {
    const grid = document.getElementById('mergeGrid');
    if (!grid) return;

    // 使用 DocumentFragment 提高性能
    const fragment = document.createDocumentFragment();
    grid.innerHTML = '';
    grid.className = 'grid grid-cols-4 gap-0 w-full h-full';
    
    this.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellElement = document.createElement('div');
        // 空單元格使用更柔和的背景，增加邊框讓格子更清晰
        cellElement.className = 'aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-transform duration-150 will-change-transform';
        
        if (cell !== 0) {
          cellElement.textContent = cell;
          // 根據數字大小調整字體大小，確保清晰可見
          let textSize = 'text-lg';
          if (cell >= 1000) textSize = 'text-lg md:text-xl';
          else if (cell >= 100) textSize = 'text-xl md:text-2xl';
          else if (cell >= 10) textSize = 'text-2xl md:text-3xl';
          else textSize = 'text-3xl md:text-4xl';
          
          cellElement.className += ` ${this.getCellClass(cell)} ${textSize}`;
        }
        
        fragment.appendChild(cellElement);
      });
    });

    grid.appendChild(fragment);
    document.getElementById('mergeScore').textContent = this.score;
  }

  getCellClass(value) {
    const classes = {
      2: 'bg-blue-50 text-blue-800 font-bold border-2 border-blue-200',
      4: 'bg-blue-100 text-blue-900 font-bold border-2 border-blue-300',
      8: 'bg-amber-100 text-amber-900 font-bold border-2 border-amber-300',
      16: 'bg-amber-200 text-amber-950 font-bold border-2 border-amber-400',
      32: 'bg-orange-200 text-orange-950 font-bold border-2 border-orange-400',
      64: 'bg-orange-400 text-white font-bold border-2 border-orange-500 shadow-md',
      128: 'bg-red-400 text-white font-bold border-2 border-red-500 shadow-md',
      256: 'bg-red-500 text-white font-bold border-2 border-red-600 shadow-lg',
      512: 'bg-pink-500 text-white font-bold border-2 border-pink-600 shadow-lg',
      1024: 'bg-purple-500 text-white font-bold border-2 border-purple-600 shadow-xl',
      2048: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white font-bold border-2 border-yellow-600 shadow-2xl animate-pulse'
    };
    return classes[value] || 'bg-gray-50 text-gray-600';
  }

  move(direction) {
    if (this.gameOver) return;

    let moved = false;
    
    switch (direction) {
      case 'left':
        moved = this.moveLeft();
        break;
      case 'right':
        moved = this.moveRight();
        break;
      case 'up':
        moved = this.moveUp();
        break;
      case 'down':
        moved = this.moveDown();
        break;
    }

    if (moved) {
      this.addRandomTile();
      
      // 使用 requestAnimationFrame 優化渲染
      requestAnimationFrame(() => {
        this.render();
      });
      
      gameEngine.playSound('click');
      gameEngine.vibrate([50]);

      if (this.checkWin()) {
        this.gameWin();
      } else if (this.checkGameOver()) {
        this.gameLose();
      }
    }
  }

  moveLeft() {
    let moved = false;
    for (let i = 0; i < this.size; i++) {
      const row = this.grid[i].filter(cell => cell !== 0);
      const newRow = [];
      
      for (let j = 0; j < row.length; j++) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          newRow.push(row[j] * 2);
          this.score += row[j] * 2;
          j++;
        } else {
          newRow.push(row[j]);
        }
      }
      
      while (newRow.length < this.size) {
        newRow.push(0);
      }
      
      if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
        moved = true;
      }
      this.grid[i] = newRow;
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let i = 0; i < this.size; i++) {
      const row = this.grid[i].filter(cell => cell !== 0);
      const newRow = [];
      
      for (let j = row.length - 1; j >= 0; j--) {
        if (j > 0 && row[j] === row[j - 1]) {
          newRow.unshift(row[j] * 2);
          this.score += row[j] * 2;
          j--;
        } else {
          newRow.unshift(row[j]);
        }
      }
      
      while (newRow.length < this.size) {
        newRow.unshift(0);
      }
      
      if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
        moved = true;
      }
      this.grid[i] = newRow;
    }
    return moved;
  }

  moveUp() {
    this.transpose();
    const moved = this.moveLeft();
    this.transpose();
    return moved;
  }

  moveDown() {
    this.transpose();
    const moved = this.moveRight();
    this.transpose();
    return moved;
  }

  transpose() {
    const newGrid = [];
    for (let i = 0; i < this.size; i++) {
      newGrid[i] = [];
      for (let j = 0; j < this.size; j++) {
        newGrid[i][j] = this.grid[j][i];
      }
    }
    this.grid = newGrid;
  }

  checkWin() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 2048) {
          return true;
        }
      }
    }
    return false;
  }

  checkGameOver() {
    // 檢查是否有空格
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 0) {
          return false;
        }
      }
    }

    // 檢查是否可以合併
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const current = this.grid[i][j];
        if (
          (i > 0 && this.grid[i - 1][j] === current) ||
          (i < this.size - 1 && this.grid[i + 1][j] === current) ||
          (j > 0 && this.grid[i][j - 1] === current) ||
          (j < this.size - 1 && this.grid[i][j + 1] === current)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  gameWin() {
    if (!this.won) {
      this.won = true;
      gameEngine.playSound('win');
      gameEngine.vibrate([100, 50, 100, 50, 200]);
      gameEngine.showToast('恭喜達到2048！', 'success');
    }
  }

  restart() {
    this.grid = [];
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.createGrid();
    this.addRandomTile();
    this.addRandomTile();
    this.render();
    gameEngine.showToast('遊戲已重新開始', 'info');
  }

  gameLose() {
    this.gameOver = true;
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`遊戲結束！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('merge', this.score);
      closeGame();
    }, 1500); // 減少等待時間
  }
}

// 全局遊戲引擎實例
const gameEngine = new MobileGameEngine();

// 當前遊戲實例
let currentGameInstance = null;

// 遊戲啟動函數
function startMemoryGame() {
  currentGameInstance = new MobileMemoryGame();
  currentGameInstance.init();
}

function startEliminateGame() {
  currentGameInstance = new SwipeEliminateGame();
  currentGameInstance.init();
}

function startReactionGame() {
  currentGameInstance = new ReactionGame();
  currentGameInstance.init();
}

function startMergeGame() {
  currentGameInstance = new SimpleMergeGame();
  currentGameInstance.init();
}

function start2048Game() {
  currentGameInstance = new SimpleMergeGame();
  currentGameInstance.init();
}

// Wordle 遊戲實裝
class WordleGame {
  constructor() {
    this.words = ['HOUSE', 'MONEY', 'CARDS', 'GAMES', 'WORLD', 'HELLO', 'WORDS', 'LIGHT', 'MUSIC', 'WATER'];
    this.targetWord = '';
    this.currentGuess = '';
    this.guesses = [];
    this.maxGuesses = 6;
    this.currentRow = 0;
    this.gameWon = false;
    this.gameOver = false;
    this.gameStarted = false;
    this.streak = 0;
  }

  init() {
    this.targetWord = this.words[Math.floor(Math.random() * this.words.length)];
    this.render();
    this.setupKeyboard();
    this.setupPhysicalKeyboard();
    this.updateControls();
  }

  setupPhysicalKeyboard() {
    // 物理鍵盤支持
    document.addEventListener('keydown', (e) => {
      if (!this.gameStarted || this.gameOver) return;
      
      // 字母輸入
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        this.addLetter(e.key.toUpperCase());
      }
      // Enter 提交
      else if (e.key === 'Enter') {
        e.preventDefault();
        this.submitGuess();
      }
      // Backspace 刪除
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.deleteLetter();
      }
    });
  }

  startGame() {
    this.gameStarted = true;
    this.updateControls();
    this.updateStatus();
  }

  restartGame() {
    this.targetWord = this.words[Math.floor(Math.random() * this.words.length)];
    this.currentGuess = '';
    this.guesses = [];
    this.currentRow = 0;
    this.gameWon = false;
    this.gameOver = false;
    this.gameStarted = true;
    this.render();
    this.updateControls();
    this.updateStatus();
    this.updateUI();
  }

  updateStatus() {
    const statusElement = document.getElementById('wordleStatus');
    if (!statusElement) return;

    if (!this.gameStarted) {
      statusElement.innerHTML = '<span class="text-gray-600">點擊「開始遊戲」開始猜詞</span>';
    } else if (this.gameOver) {
      if (this.gameWon) {
        statusElement.innerHTML = '<span class="text-green-600">🎉 恭喜猜對了！</span>';
      } else {
        statusElement.innerHTML = `<span class="text-red-600">遊戲結束！答案是: ${this.targetWord}</span>`;
      }
    } else {
      statusElement.innerHTML = '<span class="text-blue-600">正在遊戲中，輸入5字母單詞</span>';
    }
  }

  render() {
    const grid = document.getElementById('wordleGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid grid-cols-5 gap-0 w-full h-full';

    for (let row = 0; row < this.maxGuesses; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div');
        cell.className = 'aspect-square border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold uppercase';
        
        if (this.guesses[row] && this.guesses[row][col]) {
          const letter = this.guesses[row][col];
          cell.textContent = letter;
          
          if (this.targetWord[col] === letter) {
            cell.className += ' bg-green-500 text-white border-green-500';
          } else if (this.targetWord.includes(letter)) {
            cell.className += ' bg-yellow-500 text-white border-yellow-500';
          } else {
            cell.className += ' bg-gray-500 text-white border-gray-500';
          }
        } else if (row === this.currentRow && this.currentGuess[col]) {
          cell.textContent = this.currentGuess[col];
          cell.className += ' bg-white';
        }
        
        grid.appendChild(cell);
      }
    }
  }

  setupKeyboard() {
    const keyboardContainer = document.getElementById('wordleKeyboard');
    if (!keyboardContainer) return;

    keyboardContainer.innerHTML = '';
    keyboardContainer.className = 'grid grid-cols-10 gap-0 w-full';
    
    const keys = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    keys.forEach(key => {
      const keyBtn = document.createElement('button');
      keyBtn.textContent = key;
      keyBtn.className = 'p-2 bg-gray-200 rounded text-sm font-bold uppercase hover:bg-gray-300 touch-manipulation';
      keyBtn.dataset.key = key;
      keyBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.gameStarted && !this.gameOver) {
          this.addLetter(key);
        }
      }, { passive: false });
      keyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.gameStarted && !this.gameOver) {
          this.addLetter(key);
        }
      });
      keyboardContainer.appendChild(keyBtn);
    });

    const enterBtn = document.createElement('button');
    enterBtn.textContent = 'ENTER';
    enterBtn.className = 'col-span-2 p-2 bg-blue-500 text-white rounded text-sm font-bold hover:bg-blue-600 touch-manipulation';
    enterBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.gameStarted && !this.gameOver) {
        this.submitGuess();
      }
    }, { passive: false });
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.gameStarted && !this.gameOver) {
        this.submitGuess();
      }
    });
    keyboardContainer.appendChild(enterBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'DEL';
    deleteBtn.className = 'col-span-2 p-2 bg-red-500 text-white rounded text-sm font-bold hover:bg-red-600 touch-manipulation';
    deleteBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.gameStarted && !this.gameOver) {
        this.deleteLetter();
      }
    }, { passive: false });
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.gameStarted && !this.gameOver) {
        this.deleteLetter();
      }
    });
    keyboardContainer.appendChild(deleteBtn);
  }

  updateKeyboardColors() {
    const keyboardContainer = document.getElementById('wordleKeyboard');
    if (!keyboardContainer) return;

    const keyButtons = keyboardContainer.querySelectorAll('[data-key]');
    keyButtons.forEach(btn => {
      const key = btn.dataset.key;
      let colorClass = 'bg-gray-200';
      
      // 檢查這個字母在猜測中的狀態
      for (let i = 0; i < this.guesses.length; i++) {
        const guess = this.guesses[i];
        if (guess && guess.includes(key)) {
          for (let j = 0; j < guess.length; j++) {
            if (guess[j] === key) {
              if (this.targetWord[j] === key) {
                colorClass = 'bg-green-500 text-white';
                break;
              } else if (this.targetWord.includes(key)) {
                colorClass = 'bg-yellow-500 text-white';
              } else {
                colorClass = 'bg-gray-500 text-white';
              }
            }
          }
        }
      }
      
      btn.className = `p-2 ${colorClass} rounded text-sm font-bold uppercase hover:bg-gray-300 touch-manipulation`;
    });
  }

  updateControls() {
    const controls = document.getElementById('wordleControls');
    if (!controls) return;

    if (!this.gameStarted) {
      controls.innerHTML = `
        <button onclick="currentGameInstance.startGame()" class="btn-game text-sm">開始遊戲</button>
        <button onclick="closeGame()" class="btn-game text-sm">關閉</button>
      `;
    } else if (this.gameOver) {
      controls.innerHTML = `
        <button onclick="currentGameInstance.restartGame()" class="btn-game text-sm">新遊戲</button>
        <button onclick="closeGame()" class="btn-game text-sm">關閉</button>
      `;
    } else {
      controls.innerHTML = `
        <button onclick="currentGameInstance.restartGame()" class="btn-game text-sm">重新開始</button>
        <button onclick="closeGame()" class="btn-game text-sm">關閉</button>
      `;
    }
  }

  addLetter(letter) {
    if (this.currentGuess.length < 5 && !this.gameOver && this.gameStarted) {
      this.currentGuess += letter;
      this.render();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0 && !this.gameOver && this.gameStarted) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this.render();
    }
  }

  submitGuess() {
    if (this.currentGuess.length === 5 && !this.gameOver && this.gameStarted) {
      // 檢查是否為有效單詞
      if (!this.isValidWord(this.currentGuess)) {
        gameEngine.showToast('請輸入有效的5字母單詞', 'error');
        gameEngine.playSound('error');
        return;
      }

      this.guesses[this.currentRow] = this.currentGuess;
      
      if (this.currentGuess === this.targetWord) {
        this.gameWon = true;
        this.gameOver = true;
        this.streak++;
        gameEngine.playSound('win');
        gameEngine.vibrate([100, 50, 100, 50, 200]);
        gameEngine.showToast('恭喜猜對了！', 'success');
        this.updateUI();
        this.updateControls();
        this.updateStatus();
        setTimeout(() => {
          updateScore('wordle', (this.maxGuesses - this.currentRow) * 100);
        }, 1000);
      } else {
        this.currentRow++;
        this.currentGuess = '';
        
        if (this.currentRow >= this.maxGuesses) {
          this.gameOver = true;
          this.streak = 0;
          gameEngine.playSound('error');
          gameEngine.vibrate([300, 100, 300]);
          gameEngine.showToast(`遊戲結束！答案是: ${this.targetWord}`, 'error');
          this.updateControls();
          this.updateStatus();
          setTimeout(() => {
            updateScore('wordle', 0);
          }, 1000);
        }
      }
      
      this.render();
      this.updateUI();
      this.updateKeyboardColors();
      this.updateStatus();
    }
  }

  updateUI() {
    const roundElement = document.getElementById('wordleRound');
    const streakElement = document.getElementById('wordleStreak');
    
    if (roundElement) {
      roundElement.textContent = this.currentRow + 1;
    }
    
    if (streakElement) {
      streakElement.textContent = this.streak;
    }
  }

  isValidWord(word) {
    // 簡單的單詞驗證 - 檢查是否為5個字母
    return word.length === 5 && /^[A-Za-z]+$/.test(word);
  }
}

// 數獨遊戲實裝
class SudokuGame {
  constructor() {
    this.grid = [];
    this.originalGrid = [];
    this.size = 9;
    this.errors = 0;
    this.startTime = Date.now();
    this.timer = null;
    this.selectedCell = null;
  }

  init() {
    this.generatePuzzle();
    this.render();
    this.setupPhysicalKeyboard();
    this.startTimer();
  }

  setupPhysicalKeyboard() {
    // 物理鍵盤支持
    document.addEventListener('keydown', (e) => {
      if (!this.selectedCell) return;
      
      // 數字鍵 1-9
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        this.selectNumber(parseInt(e.key));
      }
      // Delete/Backspace 清除
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.clearCell();
      }
      // 方向鍵移動選中格子
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
               e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.moveSelection(e.key);
      }
    });
  }

  moveSelection(direction) {
    if (!this.selectedCell) {
      // 如果沒有選中，選中第一個空白格子
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.originalGrid[row][col] === 0) {
            this.selectCell(row, col);
            return;
          }
        }
      }
      return;
    }
    
    let { row, col } = this.selectedCell;
    
    switch(direction) {
      case 'ArrowUp':
        row = row > 0 ? row - 1 : this.size - 1;
        break;
      case 'ArrowDown':
        row = row < this.size - 1 ? row + 1 : 0;
        break;
      case 'ArrowLeft':
        col = col > 0 ? col - 1 : this.size - 1;
        break;
      case 'ArrowRight':
        col = col < this.size - 1 ? col + 1 : 0;
        break;
    }
    
    // 跳過預設數字，找到下一個空白格子
    if (this.originalGrid[row][col] !== 0) {
      // 嘗試找到同行的下一個空白格子
      for (let c = col; c < this.size; c++) {
        if (this.originalGrid[row][c] === 0) {
          this.selectCell(row, c);
          return;
        }
      }
      // 如果沒有，嘗試下一行
      for (let r = row + 1; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.originalGrid[r][c] === 0) {
            this.selectCell(r, c);
            return;
          }
        }
      }
    } else {
      this.selectCell(row, col);
    }
  }

  generatePuzzle() {
    // 簡化的數獨生成 - 預設一些數字
    this.grid = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    
    this.originalGrid = this.grid.map(row => [...row]);
  }

  render() {
    const grid = document.getElementById('sudokuGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid grid-cols-9 gap-0 w-full h-full border-2 border-gray-800';

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const cell = document.createElement('div');
        cell.className = 'aspect-square border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer';
        
        if (this.originalGrid[row][col] !== 0) {
          cell.textContent = this.originalGrid[row][col];
          cell.className += ' bg-gray-200';
        } else {
          cell.textContent = this.grid[row][col] || '';
          cell.className += ' bg-white hover:bg-gray-100 touch-manipulation';
          
          // 高亮選中的格子
          if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            cell.className += ' bg-blue-200 border-blue-500';
          }
          
          cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectCell(row, col);
          }, { passive: false });
          cell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectCell(row, col);
          });
        }
        
        grid.appendChild(cell);
      }
    }
  }

  selectCell(row, col) {
    if (this.originalGrid[row][col] !== 0) return;
    
    this.selectedCell = { row, col };
    this.render();
  }

  selectNumber(number) {
    if (!this.selectedCell) {
      gameEngine.showToast('請先選擇一個格子', 'warning');
      return;
    }
    
    const { row, col } = this.selectedCell;
    this.grid[row][col] = number;
    this.render();
    
    if (this.checkWin()) {
      this.gameWin();
    }
  }

  clearCell() {
    if (!this.selectedCell) {
      gameEngine.showToast('請先選擇一個格子', 'warning');
      return;
    }
    
    const { row, col } = this.selectedCell;
    this.grid[row][col] = 0;
    this.render();
  }

  hint() {
    if (!this.selectedCell) {
      gameEngine.showToast('請先選擇一個格子', 'warning');
      return;
    }
    
    const { row, col } = this.selectedCell;
    // 簡單的提示 - 隨機填入一個可能的數字
    const possibleNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const randomNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
    this.grid[row][col] = randomNumber;
    this.render();
    
    gameEngine.showToast('已填入提示數字', 'info');
  }


  checkWin() {
    // 簡化的勝利檢查
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.grid[row][col] === 0) return false;
      }
    }
    return true;
  }

  startTimer() {
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      document.getElementById('sudokuTime').textContent = elapsed;
    }, 1000);
  }

  gameWin() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    gameEngine.playSound('win');
    gameEngine.vibrate([100, 50, 100, 50, 200]);
    gameEngine.showToast('恭喜完成數獨！', 'success');
    setTimeout(() => {
      updateScore('sudoku', 1000);
      closeGame();
    }, 2000);
  }
}

// 俄羅斯方塊遊戲實裝
class TetrisGame {
  constructor() {
    this.boardWidth = 10;
    this.boardHeight = 20;
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameRunning = false;
    this.gameLoop = null;
    this.dropTime = 1000; // 毫秒
    this.lastTime = 0;
    
    // 俄羅斯方塊的7種形狀
    this.pieces = [
      // I
      [
        [1, 1, 1, 1]
      ],
      // O
      [
        [1, 1],
        [1, 1]
      ],
      // T
      [
        [0, 1, 0],
        [1, 1, 1]
      ],
      // S
      [
        [0, 1, 1],
        [1, 1, 0]
      ],
      // Z
      [
        [1, 1, 0],
        [0, 1, 1]
      ],
      // J
      [
        [1, 0, 0],
        [1, 1, 1]
      ],
      // L
      [
        [0, 0, 1],
        [1, 1, 1]
      ]
    ];
  }

  init() {
    this.createBoard();
    this.spawnPiece();
    this.render();
    this.setupControls();
    this.start();
  }

  createBoard() {
    this.board = [];
    for (let y = 0; y < this.boardHeight; y++) {
      this.board[y] = [];
      for (let x = 0; x < this.boardWidth; x++) {
        this.board[y][x] = 0;
      }
    }
  }

  spawnPiece() {
    const pieceType = Math.floor(Math.random() * this.pieces.length);
    this.currentPiece = {
      shape: this.pieces[pieceType],
      x: Math.floor(this.boardWidth / 2) - 1,
      y: 0,
      color: this.getPieceColor(pieceType)
    };
  }

  getPieceColor(pieceType) {
    const colors = ['#00f5ff', '#ffff00', '#800080', '#00ff00', '#ff0000', '#0000ff', '#ffa500'];
    return colors[pieceType];
  }

  render() {
    const grid = document.getElementById('tetrisGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid gap-0 w-full h-full border-2 border-gray-800 p-1';
    grid.style.gridTemplateColumns = `repeat(${this.boardWidth}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${this.boardHeight}, 1fr)`;

    // 渲染遊戲板
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const cell = document.createElement('div');
        cell.className = 'border border-gray-300 rounded-sm min-h-0';
        
        if (this.board[y][x] !== 0) {
          cell.style.backgroundColor = this.board[y][x];
          cell.style.borderColor = this.board[y][x];
        }
        
        grid.appendChild(cell);
      }
    }

    // 渲染當前方塊
    if (this.currentPiece) {
      this.currentPiece.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell !== 0) {
            const boardY = this.currentPiece.y + dy;
            const boardX = this.currentPiece.x + dx;
            
            if (boardY >= 0 && boardY < this.boardHeight && 
                boardX >= 0 && boardX < this.boardWidth) {
              const cellIndex = boardY * this.boardWidth + boardX;
              const cellElement = grid.children[cellIndex];
              if (cellElement) {
                cellElement.style.backgroundColor = this.currentPiece.color;
                cellElement.style.borderColor = this.currentPiece.color;
                cellElement.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
              }
            }
          }
        });
      });
    }

    this.updateUI();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.gameRunning) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.movePiece(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.movePiece(1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.movePiece(0, 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          this.hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          this.togglePause();
          break;
      }
    });

    // 觸控控制
    const gameArea = document.getElementById('tetrisGrid');
    if (gameArea) {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;

      gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      });

      gameArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!this.gameRunning) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;
        
        const minSwipeDistance = 30;
        const maxTapTime = 200; // 200ms 內視為點擊
        
        // 如果是快速點擊，視為旋轉
        if (deltaTime < maxTapTime && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
          this.rotatePiece();
          return;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑動
          if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
              this.movePiece(1, 0); // 右
            } else {
              this.movePiece(-1, 0); // 左
            }
          }
        } else {
          // 垂直滑動
          if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
              this.movePiece(0, 1); // 下
            } else {
              this.rotatePiece(); // 上 = 旋轉
            }
          }
        }
      });
    }
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;
    
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;
    
    if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      this.render();
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (!this.currentPiece) return;
    
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
      this.currentPiece.shape = rotated;
      this.render();
    }
  }

  rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    
    for (let i = 0; i < cols; i++) {
      rotated[i] = [];
      for (let j = 0; j < rows; j++) {
        rotated[i][j] = matrix[rows - 1 - j][i];
      }
    }
    
    return rotated;
  }

  hardDrop() {
    while (this.movePiece(0, 1)) {
      this.score += 2;
    }
    this.placePiece();
  }

  isValidPosition(shape, x, y) {
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx] !== 0) {
          const newX = x + dx;
          const newY = y + dy;
          
          if (newX < 0 || newX >= this.boardWidth || 
              newY >= this.boardHeight || 
              (newY >= 0 && this.board[newY][newX] !== 0)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  placePiece() {
    if (!this.currentPiece) return;
    
    this.currentPiece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell !== 0) {
          const boardY = this.currentPiece.y + dy;
          const boardX = this.currentPiece.x + dx;
          
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      });
    });
    
    this.clearLines();
    this.spawnPiece();
    
    // 檢查遊戲結束
    if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver();
    }
    
    this.render();
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.boardHeight - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(new Array(this.boardWidth).fill(0));
        linesCleared++;
        y++; // 重新檢查同一行
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropTime = Math.max(100, 1000 - (this.level - 1) * 100);
      
      gameEngine.playSound('success');
      gameEngine.vibrate([100]);
    }
  }

  start() {
    this.gameRunning = true;
    this.lastTime = Date.now();
    if (!this.gameLoop) {
      this.gameLoop = setInterval(() => {
        this.update();
      }, 50); // 50ms 更新頻率
    }
  }

  togglePause() {
    if (this.gameRunning) {
      this.gameRunning = false;
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      gameEngine.showToast('遊戲已暫停 (按 P 繼續)', 'info');
    } else {
      this.start();
      gameEngine.showToast('遊戲繼續', 'info');
    }
  }

  update() {
    if (!this.gameRunning) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastTime > this.dropTime) {
      if (!this.movePiece(0, 1)) {
        this.placePiece();
      }
      this.lastTime = currentTime;
    }
  }

  updateUI() {
    const scoreElement = document.getElementById('tetrisScore');
    const levelElement = document.getElementById('tetrisLevel');
    const linesElement = document.getElementById('tetrisLines');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (levelElement) levelElement.textContent = this.level;
    if (linesElement) linesElement.textContent = this.lines;
  }

  gameOver() {
    this.gameRunning = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`遊戲結束！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('tetris', this.score);
      closeGame();
    }, 2000);
  }
}

// 泡泡龍遊戲實裝
class BubbleGame {
  constructor() {
    this.grid = [];
    this.gridWidth = 8;
    this.gridHeight = 12;
    this.currentBubble = null;
    this.nextBubble = null;
    this.score = 0;
    this.round = 1;
    this.gameRunning = false;
    this.bubbleColors = ['🔴', '🟡', '🔵', '🟢', '🟣', '🟠'];
  }

  init() {
    this.createGrid();
    this.spawnBubbles();
    this.render();
    this.setupControls();
  }

  createGrid() {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  spawnBubbles() {
    this.currentBubble = {
      color: this.bubbleColors[Math.floor(Math.random() * this.bubbleColors.length)],
      x: this.gridWidth / 2,
      y: 0
    };
    this.nextBubble = {
      color: this.bubbleColors[Math.floor(Math.random() * this.bubbleColors.length)],
      x: this.gridWidth / 2,
      y: 0
    };
  }

  render() {
    const grid = document.getElementById('bubbleGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid gap-0 max-w-sm mx-auto border-2 border-gray-800 p-2';
    grid.style.gridTemplateColumns = `repeat(${this.gridWidth}, 1fr)`;

    // 渲染遊戲板
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = document.createElement('div');
        cell.className = 'w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-lg';
        
        if (this.grid[y][x]) {
          cell.textContent = this.grid[y][x];
        }
        
        grid.appendChild(cell);
      }
    }

    // 渲染當前泡泡
    if (this.currentBubble) {
      const bubbleIndex = this.currentBubble.y * this.gridWidth + this.currentBubble.x;
      const bubbleElement = grid.children[bubbleIndex];
      if (bubbleElement) {
        bubbleElement.textContent = this.currentBubble.color;
        bubbleElement.className += ' bg-white shadow-lg';
      }
    }

    this.updateUI();
  }

  setupControls() {
    const gameArea = document.getElementById('bubbleGrid');
    if (gameArea) {
      gameArea.addEventListener('click', (e) => {
        if (!this.gameRunning) return;
        
        const rect = gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const col = Math.floor(x / (rect.width / this.gridWidth));
        
        if (col >= 0 && col < this.gridWidth) {
          this.shootBubble(col);
        }
      });

      gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!this.gameRunning) return;
        
        const rect = gameArea.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const col = Math.floor(x / (rect.width / this.gridWidth));
        
        if (col >= 0 && col < this.gridWidth) {
          this.shootBubble(col);
        }
      });
    }
  }

  shootBubble(targetCol) {
    if (!this.currentBubble) return;
    
    // 簡單的射擊邏輯 - 直接放置到目標位置
    let targetRow = this.gridHeight - 1;
    while (targetRow >= 0 && this.grid[targetRow][targetCol] !== null) {
      targetRow--;
    }
    
    if (targetRow >= 0) {
      this.grid[targetRow][targetCol] = this.currentBubble.color;
      this.checkMatches(targetRow, targetCol);
      this.currentBubble = this.nextBubble;
      this.nextBubble = {
        color: this.bubbleColors[Math.floor(Math.random() * this.bubbleColors.length)],
        x: this.gridWidth / 2,
        y: 0
      };
      this.render();
    }
  }

  checkMatches(row, col) {
    const color = this.grid[row][col];
    const matches = [];
    const visited = new Set();
    
    this.findConnectedBubbles(row, col, color, matches, visited);
    
    if (matches.length >= 3) {
      matches.forEach(({r, c}) => {
        this.grid[r][c] = null;
      });
      this.score += matches.length * 10;
      gameEngine.playSound('success');
      gameEngine.vibrate([100]);
    }
  }

  findConnectedBubbles(row, col, color, matches, visited) {
    if (row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) return;
    if (visited.has(`${row},${col}`)) return;
    if (this.grid[row][col] !== color) return;
    
    visited.add(`${row},${col}`);
    matches.push({r: row, c: col});
    
    // 檢查四個方向
    this.findConnectedBubbles(row - 1, col, color, matches, visited);
    this.findConnectedBubbles(row + 1, col, color, matches, visited);
    this.findConnectedBubbles(row, col - 1, color, matches, visited);
    this.findConnectedBubbles(row, col + 1, color, matches, visited);
  }

  updateUI() {
    const scoreElement = document.getElementById('bubbleScore');
    const roundElement = document.getElementById('bubbleRound');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (roundElement) roundElement.textContent = this.round;
  }
}

// 打地鼠遊戲實裝
class WhackGame {
  constructor() {
    this.grid = [];
    this.gridSize = 3;
    this.score = 0;
    this.timeLeft = 30;
    this.hits = 0;
    this.gameRunning = false;
    this.timer = null;
    this.moleTimer = null;
  }

  init() {
    this.createGrid();
    this.render();
    this.start();
  }

  createGrid() {
    this.grid = [];
    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      this.grid[i] = { hasMole: false, moleType: 'normal' };
    }
  }

  render() {
    const grid = document.getElementById('whackGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid grid-cols-3 gap-0 w-full h-full';

    this.grid.forEach((hole, index) => {
      const holeElement = document.createElement('div');
      holeElement.className = 'aspect-square bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center text-4xl cursor-pointer transition-transform duration-200 touch-manipulation';
      
      if (hole.hasMole) {
        if (hole.moleType === 'golden') {
          holeElement.innerHTML = '🐹';
          holeElement.className += ' bg-gradient-to-b from-yellow-400 to-yellow-600 scale-110 shadow-lg';
        } else {
          holeElement.innerHTML = '🐹';
          holeElement.className += ' bg-gradient-to-b from-gray-400 to-gray-600 scale-105';
        }
      } else {
        holeElement.innerHTML = '🕳️';
      }
      
      holeElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.whackMole(index);
      }, { passive: false });
      
      holeElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.whackMole(index);
      });
      
      grid.appendChild(holeElement);
    });

    this.updateUI();
  }

  start() {
    this.gameRunning = true;
    this.startTimer();
    this.spawnMole();
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateUI();
      
      if (this.timeLeft <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  spawnMole() {
    if (!this.gameRunning) return;
    
    // 清除所有地鼠
    this.grid.forEach(hole => {
      hole.hasMole = false;
    });
    
    // 隨機生成1-2隻地鼠
    const numMoles = Math.random() < 0.7 ? 1 : 2;
    for (let i = 0; i < numMoles; i++) {
      const randomIndex = Math.floor(Math.random() * this.grid.length);
      this.grid[randomIndex].hasMole = true;
      this.grid[randomIndex].moleType = Math.random() < 0.1 ? 'golden' : 'normal';
    }
    
    this.render();
    
    // 2-4秒後自動消失
    setTimeout(() => {
      this.grid.forEach(hole => {
        hole.hasMole = false;
      });
      this.render();
      
      if (this.gameRunning) {
        this.spawnMole();
      }
    }, 2000 + Math.random() * 2000);
  }

  whackMole(index) {
    if (!this.gameRunning || !this.grid[index].hasMole) return;
    
    const mole = this.grid[index];
    this.grid[index].hasMole = false;
    this.hits++;
    
    if (mole.moleType === 'golden') {
      this.score += 50;
      gameEngine.showToast('黃金地鼠！+50分', 'success');
    } else {
      this.score += 10;
    }
    
    gameEngine.playSound('success');
    gameEngine.vibrate([50]);
    this.render();
  }

  updateUI() {
    const scoreElement = document.getElementById('whackScore');
    const timeElement = document.getElementById('whackTime');
    const hitsElement = document.getElementById('whackHits');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (timeElement) timeElement.textContent = this.timeLeft;
    if (hitsElement) hitsElement.textContent = this.hits;
  }

  gameOver() {
    this.gameRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
    }
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`時間到！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('whack', this.score);
      closeGame();
    }, 2000);
  }
}

// 剪刀石頭布遊戲實裝
class RPSGame {
  constructor() {
    this.score = 0;
    this.streak = 0;
    this.round = 0;
    this.choices = ['rock', 'paper', 'scissors'];
    this.choiceEmojis = {
      rock: '🪨',
      paper: '📄',
      scissors: '✂️'
    };
  }

  init() {
    this.render();
  }

  render() {
    const computerChoice = document.getElementById('computerChoice');
    const result = document.getElementById('rpsResult');
    
    if (computerChoice) {
      computerChoice.textContent = '🤖';
      computerChoice.classList.remove('animate-bounce');
    }
    
    if (result) {
      result.innerHTML = '選擇你的武器！';
      result.className = 'text-lg md:text-xl font-bold min-h-[2rem]';
    }
    
    this.updateUI();
  }

  playRound(playerChoice) {
    const computerChoice = this.choices[Math.floor(Math.random() * this.choices.length)];
    const result = this.getResult(playerChoice, computerChoice);
    
    // 顯示電腦選擇，添加動畫效果
    const computerChoiceElement = document.getElementById('computerChoice');
    if (computerChoiceElement) {
      computerChoiceElement.textContent = this.choiceEmojis[computerChoice];
      computerChoiceElement.classList.add('animate-bounce');
      setTimeout(() => {
        computerChoiceElement.classList.remove('animate-bounce');
      }, 1000);
    }
    
    // 顯示結果
    const resultElement = document.getElementById('rpsResult');
    if (resultElement) {
      let resultText = '';
      let resultClass = '';
      
      if (result === 'win') {
        resultText = '🎉 你贏了！';
        resultClass = 'text-green-600 dark:text-green-400';
        this.score += 10;
        this.streak++;
        gameEngine.playSound('success');
        gameEngine.vibrate([100]);
      } else if (result === 'lose') {
        resultText = '😢 你輸了！';
        resultClass = 'text-red-600 dark:text-red-400';
        this.streak = 0;
        gameEngine.playSound('error');
        gameEngine.vibrate([200]);
      } else {
        resultText = '🤝 平手！';
        resultClass = 'text-yellow-600 dark:text-yellow-400';
        gameEngine.playSound('click');
        gameEngine.vibrate([50]);
      }
      
      resultElement.innerHTML = resultText;
      resultElement.className = `text-lg md:text-xl font-bold ${resultClass} animate-pulse`;
    }
    
    this.round++;
    this.updateUI();
    
    // 2秒後重置
    setTimeout(() => {
      this.render();
    }, 2000);
  }

  getResult(player, computer) {
    if (player === computer) return 'tie';
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  }

  updateUI() {
    const scoreElement = document.getElementById('rpsScore');
    const streakElement = document.getElementById('rpsStreak');
    const roundElement = document.getElementById('rpsRound');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (streakElement) streakElement.textContent = this.streak;
    if (roundElement) roundElement.textContent = this.round;
  }
}

// 翻轉卡片遊戲實裝 - 簡單配對挑戰
class FlipcardGame {
  constructor() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.flips = 0;
    this.gameStarted = false;
    this.maxFlips = 25; // 限制翻轉次數
    this.cardSymbols = ['🎮', '🎯', '⭐', '🎨', '🎪', '🎭', '🎲', '🎵'];
  }

  init() {
    this.createCards();
    this.render();
  }

  createCards() {
    this.cards = [];
    this.cardSymbols.forEach((symbol, index) => {
      this.cards.push({ id: index * 2, symbol: symbol, flipped: false, matched: false });
      this.cards.push({ id: index * 2 + 1, symbol: symbol, flipped: false, matched: false });
    });
    
    this.cards = this.shuffleArray(this.cards);
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  render() {
    const grid = document.getElementById('flipcardGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid grid-cols-4 gap-0 w-full h-full';
    
    this.cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'aspect-square bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all duration-300 touch-manipulation will-change-transform';
      
      if (card.flipped) {
        cardElement.innerHTML = card.symbol;
        cardElement.className += ' bg-gradient-to-br from-yellow-400 to-orange-500 scale-105 shadow-lg rotate-3';
      } else if (card.matched) {
        cardElement.innerHTML = card.symbol;
        cardElement.className += ' bg-gradient-to-br from-green-400 to-green-600 opacity-75 scale-95';
      } else {
        cardElement.innerHTML = '🃏';
        cardElement.className += ' hover:scale-105 active:scale-95 hover:rotate-2';
      }
      
      cardElement.dataset.index = index;
      
      // 使用單一事件處理器避免重複綁定
      const handleCardClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.flipCard(index);
      };
      
      cardElement.addEventListener('touchstart', handleCardClick, { passive: false });
      cardElement.addEventListener('click', handleCardClick);
      
      grid.appendChild(cardElement);
    });

    this.updateUI();
  }

  flipCard(index) {
    if (!this.gameStarted) {
      this.gameStarted = true;
    }

    const card = this.cards[index];
    if (card.flipped || card.matched || this.flippedCards.length >= 2 || this.flips >= this.maxFlips) return;

    card.flipped = true;
    this.flippedCards.push({ index, card });
    this.flips++;
    
    this.render();
    gameEngine.playSound('click');
    gameEngine.vibrate([50]);

    if (this.flippedCards.length === 2) {
      setTimeout(() => this.checkMatch(), 800); // 縮短等待時間
    }
  }

  resetGame() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.flips = 0;
    this.gameStarted = false;
    this.init();
  }

  checkMatch() {
    if (this.flippedCards.length !== 2) {
      this.flippedCards = []; // 確保狀態正確
      return;
    }
    
    const [first, second] = this.flippedCards;
    
    if (first.card.symbol === second.card.symbol) {
      first.card.matched = true;
      second.card.matched = true;
      this.matchedPairs++;
      this.score += 25; // 提高分數
      gameEngine.playSound('success');
      gameEngine.vibrate([100, 50, 100]);
      gameEngine.showToast('配對成功！', 'success');
      
      if (this.matchedPairs === 8) {
        this.gameWin();
        return;
      }
    } else {
      first.card.flipped = false;
      second.card.flipped = false;
      gameEngine.playSound('error');
      gameEngine.vibrate([200]);
    }
    
    this.flippedCards = [];
    this.render();
    
    // 檢查是否達到翻轉次數限制
    if (this.flips >= this.maxFlips && this.matchedPairs < 8) {
      setTimeout(() => this.gameOver(), 500);
    }
  }

  updateUI() {
    const scoreElement = document.getElementById('flipcardScore');
    const flipsElement = document.getElementById('flipcardFlips');
    const pairsElement = document.getElementById('flipcardPairs');
    
    if (scoreElement) scoreElement.textContent = this.score;
    if (flipsElement) flipsElement.textContent = this.flips;
    if (pairsElement) pairsElement.textContent = this.matchedPairs;
  }

  gameWin() {
    this.score += (this.maxFlips - this.flips) * 5; // 剩餘翻轉次數獎勵
    this.updateUI();
    gameEngine.playSound('win');
    gameEngine.vibrate([100, 50, 100, 50, 200]);
    gameEngine.showToast(`恭喜完成！用 ${this.flips} 次翻轉完成！`, 'success');
    setTimeout(() => {
      updateScore('flipcard', this.score);
      closeGame();
    }, 2000);
  }

  gameOver() {
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`翻轉次數用完！配對了 ${this.matchedPairs}/8 對`, 'error');
    setTimeout(() => {
      updateScore('flipcard', this.score);
      closeGame();
    }, 2000);
  }
}

// 貪吃蛇遊戲實裝
class SnakeGame {
  constructor() {
    this.gridSize = 20;
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 0, y: -1 };
    this.food = { x: 5, y: 5 };
    this.score = 0;
    this.gameRunning = false;
    this.gameLoop = null;
  }

  init() {
    this.render();
    this.setupControls();
    this.setupPhysicalKeyboard();
  }

  setupPhysicalKeyboard() {
    // 物理鍵盤支持 - 在遊戲運行時才響應
    document.addEventListener('keydown', (e) => {
      if (!this.gameRunning) return;
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.direction.y === 0) {
            e.preventDefault();
            this.direction = { x: 0, y: -1 };
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.direction.y === 0) {
            e.preventDefault();
            this.direction = { x: 0, y: 1 };
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.direction.x === 0) {
            e.preventDefault();
            this.direction = { x: -1, y: 0 };
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.direction.x === 0) {
            e.preventDefault();
            this.direction = { x: 1, y: 0 };
          }
          break;
        case ' ': // 空格鍵暫停/繼續
          e.preventDefault();
          this.togglePause();
          break;
      }
    });
  }

  togglePause() {
    if (this.gameRunning) {
      this.gameRunning = false;
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      gameEngine.showToast('遊戲已暫停', 'info');
    } else {
      this.start();
      gameEngine.showToast('遊戲繼續', 'info');
    }
  }

  render() {
    const grid = document.getElementById('snakeGrid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'grid gap-0 w-full h-full border-2 border-gray-800';
    grid.style.gridTemplateColumns = 'repeat(20, 1fr)';
    grid.style.gridTemplateRows = 'repeat(20, 1fr)';

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'border border-gray-200 min-h-0';
        
        if (this.snake.some(segment => segment.x === col && segment.y === row)) {
          cell.className += ' bg-green-500';
        } else if (this.food.x === col && this.food.y === row) {
          cell.className += ' bg-red-500';
        }
        
        grid.appendChild(cell);
      }
    }
  }

  setupControls() {
    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
      if (!this.gameRunning) {
        // 如果遊戲未運行，按任意方向鍵開始
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
          e.preventDefault();
          this.start();
        }
        return;
      }
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
          break;
        case ' ': // 空格鍵暫停/繼續
          e.preventDefault();
          this.togglePause();
          break;
      }
    });

    // 觸控控制
    const gameArea = document.getElementById('snakeGrid');
    if (gameArea) {
      let touchStartX = 0;
      let touchStartY = 0;

      gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });

      gameArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!this.gameRunning) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑動
          if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && this.direction.x === 0) {
              this.direction = { x: 1, y: 0 }; // 右
            } else if (deltaX < 0 && this.direction.x === 0) {
              this.direction = { x: -1, y: 0 }; // 左
            }
          }
        } else {
          // 垂直滑動
          if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && this.direction.y === 0) {
              this.direction = { x: 0, y: 1 }; // 下
            } else if (deltaY < 0 && this.direction.y === 0) {
              this.direction = { x: 0, y: -1 }; // 上
            }
          }
        }
      });
    }
  }

  start() {
    this.gameRunning = true;
    if (!this.gameLoop) {
      this.gameLoop = setInterval(() => {
        this.update();
      }, 200);
    }
  }

  togglePause() {
    if (this.gameRunning) {
      this.gameRunning = false;
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      gameEngine.showToast('遊戲已暫停 (按空格鍵繼續)', 'info');
    } else {
      this.start();
      gameEngine.showToast('遊戲繼續', 'info');
    }
  }

  update() {
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // 檢查邊界
    if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
      this.gameOver();
      return;
    }

    // 檢查自撞
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // 檢查吃食物
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.generateFood();
      gameEngine.playSound('success');
    } else {
      this.snake.pop();
    }

    this.render();
    this.updateUI();
  }

  generateFood() {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
  }

  updateUI() {
    document.getElementById('snakeScore').textContent = this.score;
    document.getElementById('snakeLength').textContent = this.snake.length;
  }

  gameOver() {
    this.gameRunning = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    gameEngine.playSound('error');
    gameEngine.vibrate([300, 100, 300]);
    gameEngine.showToast(`遊戲結束！分數: ${this.score}`, 'error');
    setTimeout(() => {
      updateScore('snake', this.score);
      closeGame();
    }, 2000);
  }
}

// 遊戲啟動函數
function startWordleGame() {
  currentGameInstance = new WordleGame();
  currentGameInstance.init();
}

function startSudokuGame() {
  currentGameInstance = new SudokuGame();
  currentGameInstance.init();
}

function startTetrisGame() {
  currentGameInstance = new TetrisGame();
  currentGameInstance.init();
}

function startSnakeGame() {
  currentGameInstance = new SnakeGame();
  currentGameInstance.init();
  currentGameInstance.start();
}

function startWhackGame() {
  currentGameInstance = new WhackGame();
  currentGameInstance.init();
}


function startFlipcardGame() {
  currentGameInstance = new FlipcardGame();
  currentGameInstance.init();
}

function startMatch3Game() {
  // 使用現有的消除遊戲邏輯
  currentGameInstance = new SwipeEliminateGame();
  currentGameInstance.init();
}

function startRPSGame() {
  currentGameInstance = new RPSGame();
  currentGameInstance.init();
}

function startMatch3Game() {
  // 使用現有的消除遊戲邏輯
  currentGameInstance = new SwipeEliminateGame();
  currentGameInstance.init();
}