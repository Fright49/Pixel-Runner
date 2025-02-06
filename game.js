class Game {
    constructor() {
        ////////////// Elementy menu /////////////////////
        this.mainMenu = document.getElementById('mainMenu');
        this.instructionsScreen = document.getElementById('instructionsScreen');
        this.canvas = document.getElementById('gameCanvas');
        this.scoreElement = document.getElementById('score');
        this.coinCounterElement = document.getElementById('coinCounter');
        this.gameOverElement = document.getElementById('gameOver');
        
        // Przyciski menu
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showInstructions());
        document.getElementById('backToMenuButton').addEventListener('click', () => this.showMainMenu());
        document.getElementById('menuButton').addEventListener('click', () => this.showMainMenu());
        
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isGameOver = false;
        this.gameStarted = false;
        this.isInMenu = true; 
        this.showHitboxes = true; 
        
        // Skiny postaci
        this.skins = {
            knight: {
                name: 'Rycerz',
                sprite: 'adventurer-run3-sword-Sheet.png',
                frameWidth: 51120, //nw
                frameHeight: 37,
                frameCount: 68,
                visualWidth: window.innerWidth <= 768 ? 80 : 200,
                visualHeight: window.innerWidth <= 768 ? 60 : 148,
                purchased: true,
                selected: true
            },
            wizard: {
                name: 'Mag',
                sprite: 'wizard-run-Sheet.png',
                frameWidth: 50,
                frameHeight: 37,
                frameCount: 6,
                visualWidth: window.innerWidth <= 768 ? 72 : 180,
                visualHeight: window.innerWidth <= 768 ? 56 : 140,
                purchased: false,
                selected: false
            },
            archer: {
                name: 'Łucznik',
                sprite: 'archer-run-Sheet.png',
                frameWidth: 50,
                frameHeight: 37,
                frameCount: 6,
                visualWidth: window.innerWidth <= 768 ? 64 : 160,
                visualHeight: window.innerWidth <= 768 ? 52 : 130,
                purchased: false,
                selected: false
            }
        };

        this.playerId = localStorage.getItem('playerId') || this.generatePlayerId();
        //localStorage.setItem('playerId', this.playerId);

        // Load player data from the backend
        this.loadPlayerData();

        // Przyciski skinów
        document.getElementById('selectKnight').addEventListener('click', () => {
            if (this.skins.knight.purchased) {
                this.selectSkin('knight');
            }
        });
        document.getElementById('selectWizard').addEventListener('click', () => {
            if (this.skins.wizard.purchased) {
                this.selectSkin('wizard');
            } else {
                this.buySkin('wizard', 500);
            }
        });
        document.getElementById('selectArcher').addEventListener('click', () => {
            if (this.skins.archer.purchased) {
                this.selectSkin('archer');
            } else {
                this.buySkin('archer', 500);
            }
        });
        
        // Ładowanie sprite sheetu aktywnego skina
        this.loadSelectedSkin();
        
        // Ładowanie sprite sheetu
        this.playerSprite = new Image();
        this.playerSprite.src = 'adventurer-run3-sword-Sheet.png';
        this.playerSprite.onload = () => {
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        };
        this.spriteFrame = 0;
        this.frameCount = 6;
        this.frameWidth = 50;
        this.frameHeight = 37;
        this.animationSpeed = 70;
        this.lastFrameUpdate = 0;
        
        // Ładowanie tła
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'ORS97Z0.jpg';
        this.backgroundX = 0;
        this.backgroundWidth = 0;
        this.backgroundHeight = 0;
        this.backgroundY = 0;
        this.backgroundImage.onload = () => {
            // Obliczanie proporcjonalnych wymiarów tła
            const aspectRatio = this.backgroundImage.width / this.backgroundImage.height;
            this.backgroundHeight = this.canvas.height;
            this.backgroundWidth = this.backgroundHeight * aspectRatio;
            // Wycentrowanie tła w pionie
            this.backgroundY = 0;
        };
        
        // Dostosowanie rozmiaru canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Inicjalizacja gracza
        const playerWidth = 200;  // Szerokość wizualna
        const playerHeight = 148; // Wysokość wizualna
        const hitboxWidth = playerWidth * 0.4;  // Mniejszy hitbox (40% szerokości)
        const hitboxHeight = playerHeight * 0.8; // Mniejszy hitbox (80% wysokości)
        
        // Ustawienie pozycji gracza
        const groundLevel = this.canvas.height - (this.canvas.height * 0.25);
        ///////////////////////// PLAYER /////////////////////////
        this.player = {
            x: this.canvas.width * 0.1,
            y: groundLevel - playerHeight,
            width: hitboxWidth,      // Szerokość hitboxa
            height: hitboxHeight,    // Wysokość hitboxa
            visualWidth: playerWidth,  // Szerokość wizualna
            visualHeight: playerHeight, // Wysokość wizualna
            velocity: 0,
            jumping: false,
            hasShield: true,        // Czy gracz ma aktywną tarczę
            shieldTimer: 5,          // Timer tarczy
            canDoubleJump: true,    // Czy gracz może wykonać podwójny skok
            doubleJumpAvailable: true // Czy podwójny skok jest dostępny
        };

        this.groundLevel = groundLevel;

        // Przeszkody 
        this.obstacles = [15];
        this.obstacleTimer = 2;
        this.minObstacleInterval = 3000;
        this.maxObstacleInterval = 5000;
        this.obstacleInterval = this.getRandomInterval();

        // Sterowanie
        this.setupControls();
        ///////////////////////////////PODSTAWOWE KONTROLOWANIE//////////////////////////
        // Start gry
        this.lastTime = 0;
        this.gameSpeed = 4; // Prędkość tła
        this.baseObstacleSpeed = 5; // Bazowa prędkość przeszkód
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.gravity = 0.25;
        this.jumpForce = -12;

        // Aktualizacja wyniku
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalCoinsElement = document.getElementById('finalCoins');
        
        // Wczytanie najlepszego wyniku i monet z localStorage
       // this.highScore = 0;
        //this.totalCoins = 0;
        
        // Reset zakupionych ulepszeń
        this.purchasedUpgrades = {
            shield: false,
            multiplier: false,
            doubleJump: false
        };

        // Aktualizacja początkowego tekstu w menu
        const menuText = document.getElementById('menuText');
        menuText.innerHTML = `Najlepszy wynik: <span id="highScore">${this.highScore}</span> | Zebrane monety: <span id="totalCoins">${this.totalCoins}</span>`;

        // Przyciski sklepu
        document.getElementById('shopButton').addEventListener('click', () => this.showShop());
        document.getElementById('shopBackButton').addEventListener('click', () => this.showMainMenu());
        document.getElementById('buyShield').addEventListener('click', () => this.buyUpgrade('shield', 100));
        document.getElementById('buyMultiplier').addEventListener('click', () => this.buyUpgrade('multiplier', 150));
        document.getElementById('buyDoubleJump').addEventListener('click', () => this.buyUpgrade('doubleJump', 200));

        // Powerup counters
        this.powerups = {
            shield: 0,
            multiplier: 0
        };
        
        // Powerup buttons
        this.powerupButtons = {
            shield: document.getElementById('activateShield'),
            multiplier: document.getElementById('activateMultiplier')
        };
        
        // Powerup button events
        this.powerupButtons.shield.addEventListener('click', () => this.activateShield());
        this.powerupButtons.multiplier.addEventListener('click', () => this.activateMultiplier());

        // Przycisk restartu
        document.getElementById('restartButton').addEventListener('click', () => this.restart());

        // Ładowanie sprite sheetu szkieleta
        this.enemySprite = new Image();
        this.enemyFrame = 0;
        this.enemyFrameCount = 13;
        this.enemyFrameWidth = 22;
        this.enemyFrameHeight = 33;
        this.enemyAnimationSpeed = 50;
        this.lastEnemyFrameUpdate = 0;

        // Ładowanie sprite'a monety
        this.coinSprite = new Image();
        this.coinSprite.src = 'coin.png';
        this.coinFrame = 0;
        this.coinFrameCount = 8; 
        this.coinFrameWidth = 20; 
        this.coinFrameHeight = 20; 
        this.coinAnimationSpeed = 50;
        this.lastCoinFrameUpdate = 0;

        // Monety
        this.coins = [];
        this.coinTimer = 100;
        this.coinInterval = 200; 
        this.coinsCollected = 0;

        // Multiplier power-up
        this.multipliers = [];
        this.multiplierTimer = 0;
        this.multiplierChance = 0.2;
        this.multiplierDuration = 15000; // 15 sekund dla mnożnika
        this.hasMultiplier = false;
        this.scoreMultiplier = 1;

        // Shield power-up
        this.shields = [];
        this.shieldTimer = 0;
        this.shieldChance = 0.;
        this.shieldDuration = 10000; // 10 sekund dla tarczy

        // Skiny przeciwników
        this.enemySkins = {
            skeleton: {
                name: 'Szkielet',
                sprite: 'Skeleton Walk.png',
                frameWidth: 22,
                frameHeight: 33,
                frameCount: 13,
                visualWidth: window.innerWidth <= 768 ? 40 : 80,
                visualHeight: window.innerWidth <= 768 ? 60 : 120,
                purchased: true,
                selected: true
            },
            zombie: {
                name: 'Zombie',
                sprite: 'zombie-walk.png',
                frameWidth: 22,
                frameHeight: 33,
                frameCount: 13,
                visualWidth: window.innerWidth <= 768 ? 50 : 100,
                visualHeight: window.innerWidth <= 768 ? 70 : 140,
                purchased: false,
                selected: false
            },
            ghost: {
                name: 'Duch',
                sprite: 'ghost-float.png',
                frameWidth: 22,
                frameHeight: 33,
                frameCount: 13,
                visualWidth: window.innerWidth <= 768 ? 35 : 70,
                visualHeight: window.innerWidth <= 768 ? 50 : 100,
                purchased: false,
                selected: false
            }
        };

        // Wczytanie zapisanych skinów przeciwników
        const savedEnemySkins = JSON.parse(localStorage.getItem('purchasedEnemySkins')) || {};
        Object.keys(savedEnemySkins).forEach(skinKey => {
            if (this.enemySkins[skinKey]) {
                this.enemySkins[skinKey].purchased = savedEnemySkins[skinKey].purchased;
                this.enemySkins[skinKey].selected = savedEnemySkins[skinKey].selected;
            }
        });

        // Ładowanie sprite sheetu aktywnego skina przeciwnika
        this.loadSelectedEnemySkin();

        // Przyciski skinów przeciwników
        document.getElementById('selectSkeleton').addEventListener('click', () => {
            if (this.enemySkins.skeleton.purchased) {
                this.selectEnemySkin('skeleton');
            }
        });
        document.getElementById('selectZombie').addEventListener('click', () => {
            if (this.enemySkins.zombie.purchased) {
                this.selectEnemySkin('zombie');
            } else {
                this.buyEnemySkin('zombie', 300);
            }
        });
        document.getElementById('selectGhost').addEventListener('click', () => {
            if (this.enemySkins.ghost.purchased) {
                this.selectEnemySkin('ghost');
            } else {
                this.buyEnemySkin('ghost', 300);
            }
        });

        

        // Tła gry
        this.backgrounds = {
            default: {
                name: 'Podstawowe',
                sprite: 'ORS97Z0.jpg',
                purchased: true,
                selected: true
            },
            jungle: {
                name: 'Dżungla',
                sprite: 'nice.avif',
                purchased: false,
                selected: false
            },
            castle: {
                name: 'Zamek',
                sprite: 'desert.avif',
                purchased: false,
                selected: false
            }
        };

        // Wczytanie zapisanych teł
        const savedBackgrounds = JSON.parse(localStorage.getItem('purchasedBackgrounds')) || {};
        Object.keys(savedBackgrounds).forEach(bgKey => {
            if (this.backgrounds[bgKey]) {
                this.backgrounds[bgKey].purchased = savedBackgrounds[bgKey].purchased;
                this.backgrounds[bgKey].selected = savedBackgrounds[bgKey].selected;
            }
        });

        // Przyciski tła
        document.getElementById('selectDefaultBg').addEventListener('click', () => {
            if (this.backgrounds.default.purchased) {
                this.selectBackground('default');
            }
        });
        document.getElementById('selectJungleBg').addEventListener('click', () => {
            if (this.backgrounds.jungle.purchased) {
                this.selectBackground('jungle');
            } else {
                this.buyBackground('jungle', 400);
            }
        });
        document.getElementById('selectCastleBg').addEventListener('click', () => {
            if (this.backgrounds.castle.purchased) {
                this.selectBackground('castle');
            } else {
                this.buyBackground('castle', 400);
            }
        });

        // Ładowanie wybranego tła
        this.loadSelectedBackground();

        // Dodaj obsługę dotyku dla wszystkich przycisków
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.click();
            }, { passive: false });
        });
    }
    /////////////////////// KONIEC KONSTRUKTORAA ///////////////////////
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    async loadPlayerData() {
        try {
            const response = await fetch(`http://localhost:3000/api/player/${this.playerId}`);
            const data = await response.json();

            if (data) {
                this.highScore = data.high_score || 0;
                this.totalCoins = data.total_coins || 0;
                this.purchasedUpgrades = data.purchased_upgrades || {
                    shield: false,
                    multiplier: false,
                    doubleJump: false
                };
                this.powerups = data.powerups || {
                    shield: 0,
                    multiplier: 0
                };

                // Set double jump ability based on purchased upgrades
                if (this.player && this.purchasedUpgrades.doubleJump) {
                    this.player.canDoubleJump = true;
                }

                // Load skins data
                if (data.purchased_skins) {
                    Object.keys(this.skins).forEach(skinKey => {
                        if (data.purchased_skins[skinKey]) {
                            this.skins[skinKey].purchased = data.purchased_skins[skinKey].purchased;
                            this.skins[skinKey].selected = data.purchased_skins[skinKey].selected;
                        }
                    });
                }

                // Load enemy skins data
                if (data.purchased_enemy_skins) {
                    Object.keys(this.enemySkins).forEach(skinKey => {
                        if (data.purchased_enemy_skins[skinKey]) {
                            this.enemySkins[skinKey].purchased = data.purchased_enemy_skins[skinKey].purchased;
                            this.enemySkins[skinKey].selected = data.purchased_enemy_skins[skinKey].selected;
                        }
                    });
                }

                // Load backgrounds data
                if (data.purchased_backgrounds) {
                    Object.keys(this.backgrounds).forEach(bgKey => {
                        if (data.purchased_backgrounds[bgKey]) {
                            this.backgrounds[bgKey].purchased = data.purchased_backgrounds[bgKey].purchased;
                            this.backgrounds[bgKey].selected = data.purchased_backgrounds[bgKey].selected;
                        }
                    });
                    // Make sure at least one background is selected
                    const hasSelectedBackground = Object.values(this.backgrounds).some(bg => bg.selected);
                    if (!hasSelectedBackground) {
                        this.backgrounds.default.selected = true;
                    }
                }

                // Update UI and load assets
                this.updatePowerupButtons();
                this.updateSkinButtons();
                this.updateEnemySkinButtons();
                this.updateBackgroundButtons();
                this.loadSelectedBackground(); // Load the selected background
                const menuText = document.getElementById('menuText');
                menuText.innerHTML = `Najlepszy wynik: <span id="highScore">${this.highScore}</span> | Zebrane monety: <span id="totalCoins">${this.totalCoins}</span>`;
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            // Initialize with default values if loading fails
            this.initializeDefaultValues();
            this.loadSelectedBackground(); // Load default background if data loading fails
        }
    }

    initializeDefaultValues() {
        this.highScore = 0;
        this.totalCoins = 0;
        this.purchasedUpgrades = {
            shield: false,
            multiplier: false,
            doubleJump: false
        };
        this.powerups = {
            shield: 1,
            multiplier: 0
        };
        
        // Set default skin states
        Object.keys(this.skins).forEach(skinKey => {
            this.skins[skinKey].purchased = skinKey === 'knight';
            this.skins[skinKey].selected = skinKey === 'knight';
        });
        
        // Set default enemy skin states
        Object.keys(this.enemySkins).forEach(skinKey => {
            this.enemySkins[skinKey].purchased = skinKey === 'skeleton';
            this.enemySkins[skinKey].selected = skinKey === 'skeleton';
        });
        
        // Set default background states
        Object.keys(this.backgrounds).forEach(bgKey => {
            this.backgrounds[bgKey].purchased = bgKey === 'default';
            this.backgrounds[bgKey].selected = bgKey === 'default';
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const isMobile = window.innerWidth <= 768;
        
        // Dostosuj rozmiar canvas do orientacji ekranu
        if (window.innerHeight > window.innerWidth) {
            // Orientacja pionowa (telefon)
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight * 0.7;
        } else {
            // Orientacja pozioma
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        // Aktualizacja wymiarów tła
        if (this.backgroundImage.complete) {
            const aspectRatio = this.backgroundImage.width / this.backgroundImage.height;
            this.backgroundHeight = this.canvas.height;
            this.backgroundWidth = this.backgroundHeight * aspectRatio;
            this.backgroundY = 0;
        }

        // Pobierz aktywny skin gracza
        const selectedSkin = Object.values(this.skins).find(skin => skin.selected) || this.skins.knight;
        
        // Dostosuj rozmiary gracza
        const playerWidth = selectedSkin.visualWidth;
        const playerHeight = selectedSkin.visualHeight;
        const hitboxWidth = playerWidth * (isMobile ? 0.5 : 0.4);  // Mniejszy hitbox na mobile
        const hitboxHeight = playerHeight * (isMobile ? 0.6 : 0.8); // Mniejszy hitbox na mobile
        const groundLevel = this.canvas.height - (this.canvas.height * 0.25);

        // Aktualizacja wymiarów i pozycji gracza
        if (this.player) {
            this.groundLevel = groundLevel;
            this.player.width = hitboxWidth;
            this.player.height = hitboxHeight;
            this.player.visualWidth = playerWidth;
            this.player.visualHeight = playerHeight;
            this.player.x = this.canvas.width * 0.8;
            this.player.y = groundLevel - playerHeight;
        }

        // Dostosuj rozmiary przeszkód
        if (this.obstacles) {
            this.obstacles.forEach(obstacle => {
                if (obstacle.isEnemy) {
                    const selectedEnemySkin = Object.values(this.enemySkins).find(skin => skin.selected) || this.enemySkins.skeleton;
                    obstacle.width = selectedEnemySkin.visualWidth;
                    obstacle.height = selectedEnemySkin.visualHeight;
                }
            });
        }

        // Dostosuj rozmiary monet i power-upów
        
        
       
        // Dostosuj rozmiar czcionki dla elementów UI
        const uiScale = isMobile ? 0.8 : 1;
        this.scoreElement.style.fontSize = `${24 * uiScale}px`;
        this.coinCounterElement.style.fontSize = `${24 * uiScale}px`;
    }

    setupControls() {
        // Obsługa dotyku na canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Zapobiegaj domyślnym gestom
            if (!this.isInMenu && !this.isGameOver) {
                this.jump();
            }
        }, { passive: false });

        // Obsługa przycisku skoku
        const jumpButton = document.getElementById('jumpButton');
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isInMenu && !this.isGameOver) {
                this.jump();
            }
        }, { passive: false });

        jumpButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.isInMenu && !this.isGameOver) {
                this.jump();
            }
        });
        
        // Obsługa klawiatury
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!this.isInMenu && !this.isGameOver) {
                    this.jump();
                }
            }
        });

        // Zapobiegaj przewijaniu strony na mobilnych
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Obsługa przycisków powerup na dotyk
        const powerupButtons = document.querySelectorAll('.powerup-button');
        powerupButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!button.disabled) {
                    button.click();
                }
            }, { passive: false });
        });

        // Obsługa zmiany orientacji ekranu
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });

        // Blokuj przewijanie podczas gry
        document.body.addEventListener('scroll', (e) => {
            if (!this.isInMenu) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    jump() {
        if (!this.player.jumping) {
            this.player.jumping = true;
            this.player.velocity = this.jumpForce;
        } else if (this.player.canDoubleJump && this.player.doubleJumpAvailable) {
            this.player.velocity = this.jumpForce;
            this.player.doubleJumpAvailable = false;
        }
    }

    getRandomInterval() {
        return Math.random() * (this.maxObstacleInterval - this.minObstacleInterval) + this.minObstacleInterval;
    }
///////////////////////////////////// UPDATEEEEEEEEEEEEEEEEE GRY//////////////////////////////////////////////////////////////
    update(timestamp, deltaTime) {
        // Nie aktualizuj gry, jeśli jesteśmy w menu
        if (this.isGameOver || this.isInMenu) return;

        // Aktualizacja tarczy gracza
        if (this.player.hasShield) {
            this.player.shieldTimer -= 16; // Około 16ms na klatkę
            if (this.player.shieldTimer <= 0) {
                this.player.hasShield = false;
            }
        }

        // Aktualizacja mnożnika
        if (this.hasMultiplier) {
            this.multiplierTimer -= 16;
            if (this.multiplierTimer <= 0) {
                this.hasMultiplier = false;
                this.scoreMultiplier = 1;
            }
        }

        // Aktualizacja tła
        this.backgroundX -= this.gameSpeed;
        if (this.backgroundX <= -this.backgroundWidth) {
            this.backgroundX = -(this.backgroundX + this.backgroundWidth);
        }

        // Aktualizacja animacji
        if (timestamp - this.lastFrameUpdate > this.animationSpeed) {
            this.spriteFrame = (this.spriteFrame + 1) % this.frameCount;
            this.lastFrameUpdate = timestamp;
        }

        // Aktualizacja gracza
        this.player.velocity += this.gravity;
        this.player.y += this.player.velocity;
      
        // Sprawdzenie kolizji z podłożem
        if (this.player.y > this.groundLevel - this.player.height) {
            this.player.y = this.groundLevel - this.player.height;
            this.player.velocity = 0;
            this.player.jumping = false;
            this.player.doubleJumpAvailable = true;
        }

        // Aktualizacja animacji szkieleta
        if (timestamp - this.lastEnemyFrameUpdate > this.enemyAnimationSpeed) {
            this.enemyFrame = (this.enemyFrame + 1) % this.enemyFrameCount;
            this.lastEnemyFrameUpdate = timestamp;
        }

        // Generowanie przeszkód
        this.obstacleTimer += deltaTime;
        if (this.obstacleTimer > this.obstacleInterval) {
            const selectedEnemySkin = Object.values(this.enemySkins).find(skin => skin.selected) || this.enemySkins.skeleton;
            const obstacleWidth = selectedEnemySkin.visualWidth;
            const obstacleHeight = selectedEnemySkin.visualHeight;
            const randomYOffset = (Math.random() * 20 - 10) - 10;
            const shouldSpawnGroup = Math.random() < 0.3;
            
            if (shouldSpawnGroup) {
                const spacing = obstacleWidth + 40; // Odstęp między przeciwnikami
                
                for (let i = 0; i < 2; i++) {
                    this.obstacles.push({
                        x: this.canvas.width + (i * spacing),
                        y: this.groundLevel - obstacleHeight + randomYOffset,
                        width: obstacleWidth,
                        height: obstacleHeight,
                        isEnemy: true,
                        isInGroup: i > 0
                    });
                }
            } else {
                this.obstacles.push({
                    x: this.canvas.width,
                    y: this.groundLevel - obstacleHeight + randomYOffset,
                    width: obstacleWidth,
                    height: obstacleHeight,
                    isEnemy: true,
                    isInGroup: false
                });
            }
            
            // Losowa szansa na wygenerowanie tarczy
            if (Math.random() < this.shieldChance) {
                const shieldSize = 40;
                const minHeight = 100; // Minimalna wysokość od ziemi
                const maxHeight = 250; // Maksymalna wysokość, dostosowana do wysokości skoku gracza
                const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
                
                this.shields.push({
                    x: this.canvas.width,
                    y: this.groundLevel - randomHeight,
                    width: shieldSize,
                    height: shieldSize
                });
            }
            
            // Losowa szansa na wygenerowanie mnożnika
            if (Math.random() < this.multiplierChance) {
                const multiplierSize = 40;
                const minHeight = 100;
                const maxHeight = 250;
                const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
                
                this.multipliers.push({
                    x: this.canvas.width,
                    y: this.groundLevel - randomHeight,
                    width: multiplierSize,
                    height: multiplierSize
                });
            }
            
            this.obstacleTimer = 0;
            this.obstacleInterval = this.getRandomInterval();
            this.minObstacleInterval = Math.max(1000, 1500 - this.score * 10);
            this.maxObstacleInterval = Math.max(2000, 4000 - this.score * 20);
        }

        // Aktualizacja tarcz
        for (let i = this.shields.length - 1; i >= 0; i--) {
            const shield = this.shields[i];
            shield.x -= this.gameSpeed; 

            if (shield.x + shield.width < 0) {
                this.shields.splice(i, 1);
            }

            // Sprawdzanie kolizji z tarczą
            if (this.checkCollision(this.player, shield)) {
                this.shields.splice(i, 1);
                this.player.hasShield = true;
                this.player.shieldTimer = this.shieldDuration;
            }
        }

        // Aktualizacja mnożników
        for (let i = this.multipliers.length - 1; i >= 0; i--) {
            const multiplier = this.multipliers[i];
            multiplier.x -= this.gameSpeed;

            if (multiplier.x + multiplier.width < 0) {
                this.multipliers.splice(i, 1);
            }

            // Sprawdzanie kolizji z mnożnikiem
            if (this.checkCollision(this.player, multiplier)) {
                this.multipliers.splice(i, 1);
                this.hasMultiplier = true;
                this.scoreMultiplier = 2;
                this.multiplierTimer = this.multiplierDuration;
            }
        }

        // Aktualizacja przeszkód
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            // Dodatkowa prędkość dla szkieletów bazowana na wyniku
            const additionalSpeed = Math.floor(this.score / 10);
            obstacle.x -= (this.baseObstacleSpeed + additionalSpeed);

            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                if (!obstacle.isInGroup) {
                    this.score += 1 * this.scoreMultiplier;
                    this.scoreElement.textContent = this.score;
                    
                    // jesli speed  10 points
                    if (this.score % 10 === 0) {
                        this.gameSpeed += 1;
                        this.baseObstacleSpeed += 1;
                        
                        this.gravity += 0.05;
                        this.jumpForce -= 0.5;
                    }
                }
            }

            if (this.checkCollision(this.player, obstacle) && !this.player.hasShield) {
                this.gameOver();
            }
        }

        // Aktualizacja animacji monety
        if (timestamp - this.lastCoinFrameUpdate > this.coinAnimationSpeed) {
            this.coinFrame = (this.coinFrame + 1) % this.coinFrameCount;
            this.lastCoinFrameUpdate = timestamp;
        }

        // Generowanie monet
        this.coinTimer += deltaTime;
        if (this.coinTimer > this.coinInterval) {
            const coinSize = window.innerHeight * 0.05; // 5% wysokości ekranu
            const randomHeight = Math.random() * (this.canvas.height * 0.4); // Losowa wysokość w górnej połowie ekranu
            
            this.coins.push({
                x: this.canvas.width,
                y: this.groundLevel - randomHeight - coinSize,
                width: coinSize,
                height: coinSize,
                collected: false
            });
            
            this.coinTimer = 0;
        }

        // Aktualizacja monet
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.x -= this.gameSpeed;

            if (this.checkCollision(this.player, coin) && !coin.collected) {
                coin.collected = true;
                this.coinsCollected += 1 * this.scoreMultiplier;
                this.coinCounterElement.textContent = `🪙 ${this.coinsCollected}`;
            }

            if (coin.x + coin.width < 0 || coin.collected) {
                this.coins.splice(i, 1);
            }
        }
    }
    /////////////////// KOLIZJA ///////////////////
    checkCollision(player, obstacle) {
        // Obliczanie offsetu dla wyśrodkowania hitboxa
        const hitboxOffsetX = (player.visualWidth - player.width) / 2;
        const hitboxOffsetY = (player.visualHeight - player.height) / 2;

        const playerLeft = player.x + hitboxOffsetX;
        const playerRight = playerLeft + player.width;
        const playerTop = player.y + hitboxOffsetY;
        const playerBottom = playerTop + player.height;

        return playerLeft < (obstacle.x + obstacle.width) &&
               playerRight > obstacle.x &&
               playerTop < (obstacle.y + obstacle.height) &&
               playerBottom > obstacle.y;
    }

    

    draw() {
        // Nie rysuj gry, jeśli  w menu
        if (this.isInMenu) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Rysowanie tła
        try {
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Rysowanie trzech kopii tła dla płynnego przewijania
            for (let i = 0; i < 3; i++) {
                this.ctx.drawImage(
                    this.backgroundImage,
                    this.backgroundX + (i * this.backgroundWidth),
                    this.backgroundY,
                    this.backgroundWidth,
                    this.backgroundHeight
                );
            }
        } catch (error) {
            // Fallback dla tła
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

      
        // this.ctx.fillStyle = '#333';
        // this.ctx.fillRect(0, this.groundLevel, this.canvas.width, 1);

        try {
            // Rysowanie gracza w pełnym rozmiarze
            const playerX = this.player.x + (this.player.visualWidth - this.player.width) / 2 - (this.player.visualWidth - this.player.width) / 2;
            const playerY = this.player.y;

            // Rysowanie tarczy wokół gracza
            if (this.player.hasShield) {
                this.ctx.save();
                this.ctx.beginPath();
                const centerX = this.player.x + (this.player.visualWidth - this.player.width) / 2 + this.player.width / 2;
                const centerY = this.player.y + (this.player.visualHeight - this.player.height) / 2 + this.player.height / 2;
                this.ctx.arc(
                    centerX,
                    centerY,
                    Math.max(this.player.width, this.player.height) * 0.7,
                    0,
                    Math.PI * 2
                );
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                this.ctx.fill();
                this.ctx.restore();
            }

            this.ctx.drawImage(
                this.playerSprite,
                this.spriteFrame * this.frameWidth,
                0,
                this.frameWidth,
                this.frameHeight,
                playerX,
                playerY,
                this.player.visualWidth,
                this.player.visualHeight
            );

            
            if (this.showHitboxes) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.strokeRect(
                    this.player.x + (this.player.visualWidth - this.player.width) / 2,
                    this.player.y + (this.player.visualHeight - this.player.height) / 2,
                    this.player.width,
                    this.player.height
                );
            }
        } catch (error) {
            // Fallback w przypadku błędu ładowania sprite'a
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(
                this.player.x + (this.player.visualWidth - this.player.width) / 2,
                this.player.y + (this.player.visualHeight - this.player.height) / 2,
                this.player.width,
                this.player.height
            );
        }

        // Rysowanie paska tarczy jeśli jest aktywna
        if (this.player.hasShield) {
            const barWidth = 100;
            const barHeight = 8;
            const x = 20;
            const y = 20;
            const progress = 1 - (this.player.shieldTimer / this.shieldDuration);
            const cornerRadius = 4; // Zaokrąglone rogi
            
            // Funkcja do rysowania zaokrąglonego prostokąta
            const roundRect = (x, y, width, height, radius) => {
                this.ctx.beginPath();
                this.ctx.moveTo(x + radius, y);
                this.ctx.lineTo(x + width - radius, y);
                this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.ctx.lineTo(x + width, y + height - radius);
                this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.ctx.lineTo(x + radius, y + height);
                this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.ctx.lineTo(x, y + radius);
                this.ctx.quadraticCurveTo(x, y, x + radius, y);
                this.ctx.closePath();
            };
            
            // Tło paska
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            roundRect(x, y, barWidth, barHeight, cornerRadius);
            this.ctx.fill();
            
            // Pasek postępu
            const gradient = this.ctx.createLinearGradient(x, y, x + barWidth * progress, y);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 200, 255, 0.6)');
            this.ctx.save();
            this.ctx.clip();
            this.ctx.fillStyle = gradient;
            roundRect(x, y, barWidth * progress, barHeight, cornerRadius);
            this.ctx.fill();
            this.ctx.restore();
            
            // Delikatna poświata
            this.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            this.ctx.shadowBlur = 10;
            roundRect(x, y, barWidth, barHeight, cornerRadius);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        // Rysowanie paska mnożnika jeśli jest aktywny
        if (this.hasMultiplier) {
            const barWidth = 100;
            const barHeight = 8;
            const x = 20;
            const y = 40; // Poniżej paska tarczy
            const progress = 1 - (this.multiplierTimer / this.multiplierDuration);
            const cornerRadius = 4;
            
            // Funkcja do rysowania zaokrąglonego prostokąta
            const roundRect = (x, y, width, height, radius) => {
                this.ctx.beginPath();
                this.ctx.moveTo(x + radius, y);
                this.ctx.lineTo(x + width - radius, y);
                this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.ctx.lineTo(x + width, y + height - radius);
                this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.ctx.lineTo(x + radius, y + height);
                this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.ctx.lineTo(x, y + radius);
                this.ctx.quadraticCurveTo(x, y, x + radius, y);
                this.ctx.closePath();
            };
            
            // Tło paska
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            roundRect(x, y, barWidth, barHeight, cornerRadius);
            this.ctx.fill();
            
            // Pasek postępu
            const gradient = this.ctx.createLinearGradient(x, y, x + barWidth * progress, y);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)'); 
            gradient.addColorStop(1, 'rgba(255, 165, 0, 0.6)');
            this.ctx.save();
            this.ctx.clip();
            this.ctx.fillStyle = gradient;
            roundRect(x, y, barWidth * progress, barHeight, cornerRadius);
            this.ctx.fill();
            this.ctx.restore();
            
            // Delikatna poświata
            this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            roundRect(x, y, barWidth, barHeight, cornerRadius);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Wyświetlanie mnożnika
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('×2', x + barWidth + 10, y + barHeight - 1);
        }

        // Rysowanie przeszkód (przeciwników)
        this.obstacles.forEach(obstacle => {
            if (obstacle.isEnemy && this.enemySprite.complete) { 
                try {
                    this.ctx.save();
                    this.ctx.imageSmoothingEnabled = false;
                    
                    
                    this.ctx.translate(obstacle.x + obstacle.width, obstacle.y);
                    this.ctx.scale(-1, 1);
                    
                    this.ctx.drawImage(
                        this.enemySprite,
                        this.enemyFrame * this.enemyFrameWidth,
                        0,
                        this.enemyFrameWidth,
                        this.enemyFrameHeight,
                        0,
                        0,
                        obstacle.width,
                        obstacle.height
                    );
                    
                    this.ctx.restore();

                    if (this.showHitboxes) {
                        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    }
                } catch (error) {
                    this.ctx.fillStyle = '#f00';
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                }
            }
        });

        // Rysowanie tarcz
        for (const shield of this.shields) {
            
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; 
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Dodanie poświaty
            this.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('🛡️', shield.x + shield.width/2, shield.y + shield.height/2);
            this.ctx.shadowBlur = 0;
            
            // Rysowanie hitboxów tarcz jeśli włączone
            if (this.showHitboxes) {
                this.ctx.strokeStyle = 'blue';
                this.ctx.strokeRect(shield.x, shield.y, shield.width, shield.height);
            }
        }

        // Rysowanie mnożników
        for (const multiplier of this.multipliers) {
            // Rysowanie tekstu "2×"
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'; // Złoty kolor
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Dodanie poświaty
            this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('2×', multiplier.x + multiplier.width/2, multiplier.y + multiplier.height/2);
            this.ctx.shadowBlur = 0;
            
            // Rysowanie hitboxów mnożników jeśli włączone
            if (this.showHitboxes) {
                this.ctx.strokeStyle = 'yellow';
                this.ctx.strokeRect(multiplier.x, multiplier.y, multiplier.width, multiplier.height);
            }
        }

        // Rysowanie monet
        this.coins.forEach(coin => {
            if (!coin.collected) {
                try {
                    this.ctx.drawImage(
                        this.coinSprite,
                        this.coinFrame * this.coinFrameWidth,
                        0, 
                        this.coinFrameWidth,
                        this.coinFrameHeight,
                        coin.x,
                        coin.y,
                        coin.width,
                        coin.height
                    );
                } catch (error) {
                    // Fallback dla monety
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        coin.x + coin.width / 2,
                        coin.y + coin.height / 2,
                        coin.width / 2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        });
    }

    startGame() {
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.add('hidden');
        document.getElementById('shopScreen').classList.add('hidden');
        this.canvas.classList.remove('hidden');
        this.scoreElement.classList.remove('hidden');
        this.coinCounterElement.classList.remove('hidden');
        document.getElementById('powerupButtons').classList.remove('hidden');
        document.getElementById('jumpButton').classList.remove('hidden');
        this.isInMenu = false;
        
        // Aktualizuj przyciski powerup przed rozpoczęciem gry
        this.updatePowerupButtons();
        
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.playerSprite.onload = () => {
                requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            };
        } else {
            this.restart();
        }
    }

    restart() {
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.coinsCollected = 0;
        this.coinCounterElement.textContent = '🪙 0';
        this.isGameOver = false;
        this.isInMenu = false;
        this.gameOverElement.classList.add('hidden');
        this.obstacles = [];
        this.player.y = this.groundLevel - this.player.height;
        this.player.velocity = 0;
        this.player.jumping = false;
        this.player.hasShield = false;
        this.player.shieldTimer = 0;
        this.hasMultiplier = false;
        this.multiplierTimer = 0;
        this.scoreMultiplier = 1;
        // Enable double jump if purchased
        this.player.canDoubleJump = this.purchasedUpgrades.doubleJump;
        this.player.doubleJumpAvailable = true;
        this.gameSpeed = 3;
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.minObstacleInterval = 1500;
        this.maxObstacleInterval = 4000;
        this.obstacleInterval = this.getRandomInterval();
        this.backgroundX = 0;
        this.coins = [];
        this.coinTimer = 0;
        this.shields = [];
        this.shieldTimer = 0;
        this.multipliers = [];
        
        // Aktualizuj przyciski powerup
        this.updatePowerupButtons();
    }

    showInstructions() {
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.remove('hidden');
        this.canvas.classList.add('hidden');
        this.scoreElement.classList.add('hidden');
        this.coinCounterElement.classList.add('hidden');
        document.getElementById('jumpButton').classList.add('hidden');
        this.isInMenu = true;
        this.isGameOver = false;
        this.gameOverElement.classList.add('hidden');
        this.obstacles = []; 
        this.coins = [];     
        this.shields = [];   
        this.multipliers = []; 
    }

    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.instructionsScreen.classList.add('hidden');
        document.getElementById('shopScreen').classList.add('hidden');
        document.getElementById('powerupButtons').classList.add('hidden');
        document.getElementById('jumpButton').classList.add('hidden');
        this.canvas.classList.add('hidden');
        this.scoreElement.classList.add('hidden');
        this.coinCounterElement.classList.add('hidden');
        this.gameOverElement.classList.add('hidden');
        this.isInMenu = true;
        this.isGameOver = false;
        this.obstacles = [];  
        this.coins = [];    
        this.shields = [];   
        this.multipliers = []; 
        // Aktualizacja tekstu w menu głównym
        const menuText = document.getElementById('menuText');
        menuText.innerHTML = `Najlepszy wynik: <span id="highScore">${this.highScore}</span> | Zebrane monety: <span id="totalCoins">${this.totalCoins}</span>`;
    }

    showShop() {
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.add('hidden');
        this.canvas.classList.add('hidden');
        this.scoreElement.classList.add('hidden');
        this.coinCounterElement.classList.add('hidden');
        this.gameOverElement.classList.add('hidden');
        document.getElementById('jumpButton').classList.add('hidden');
        document.getElementById('shopScreen').classList.remove('hidden');
        
        // Aktualizacja wyświetlanych monet
        document.getElementById('shopTotalCoins').textContent = this.totalCoins;
        
        // Aktualizacja przycisków na podstawie zakupionych ulepszeń
        const buyShieldBtn = document.getElementById('buyShield');
        const buyMultiplierBtn = document.getElementById('buyMultiplier');
        const buyDoubleJumpBtn = document.getElementById('buyDoubleJump');
        
        // Double jump może być kupiony tylko raz
        buyDoubleJumpBtn.disabled = this.purchasedUpgrades.doubleJump;
        buyDoubleJumpBtn.textContent = this.purchasedUpgrades.doubleJump ? 'Zakupione' : 'Kup';
        
        // Tarcza i mnożnik mogą być kupowane wielokrotnie
        buyShieldBtn.textContent = `Kup (${this.powerups.shield})`;
        buyMultiplierBtn.textContent = `Kup (${this.powerups.multiplier})`;
        buyShieldBtn.disabled = false;
        buyMultiplierBtn.disabled = false;

        // Aktualizacja przycisków skinów
        this.updateSkinButtons();
        this.updateEnemySkinButtons();
        this.updateBackgroundButtons();
    }

    buyUpgrade(type, cost) {
        if (type === 'doubleJump') {
            if (this.totalCoins >= cost && !this.purchasedUpgrades[type]) {
                this.totalCoins -= cost;
                this.purchasedUpgrades[type] = true;
                this.player.canDoubleJump = true;
                this.savePlayerData();
            }
        } else if (type === 'shield' || type === 'multiplier') {
            if (this.totalCoins >= cost) {
                this.totalCoins -= cost;
                this.powerups[type]++;
                this.updatePowerupButtons();
                this.savePlayerData();
            }
        }
        // Aktualizacja wyświetlanych monet
        document.getElementById('shopTotalCoins').textContent = this.totalCoins;
        document.getElementById('totalCoins').textContent = this.totalCoins;
        this.showShop();
    }

    activateShield() {
        if (this.powerups.shield > 0) {
            this.powerups.shield--;
            this.player.hasShield = true;
            this.player.shieldTimer = this.shieldDuration;
            if (this.player.shieldTimer > 0) {
                this.player.shieldTimer += this.shieldDuration;
            }
            this.updatePowerupButtons();
        }
    }

    activateMultiplier() {
        if (this.powerups.multiplier > 0) {
            this.powerups.multiplier--;
            this.hasMultiplier = true;
            this.scoreMultiplier = 2;
            if (this.multiplierTimer > 0) {
                this.multiplierTimer += this.multiplierDuration;
            } else {
                this.multiplierTimer = this.multiplierDuration;
            }
            this.updatePowerupButtons();
        }
    }

    updatePowerupButtons() {
        // Aktualizuj liczniki na przyciskach
        const shieldCount = document.querySelector('#activateShield .powerup-count');
        const multiplierCount = document.querySelector('#activateMultiplier .powerup-count');
        
        if (shieldCount) shieldCount.textContent = this.powerups.shield;
        if (multiplierCount) multiplierCount.textContent = this.powerups.multiplier;
        
        // Włącz/wyłącz przyciski
        const shieldButton = document.getElementById('activateShield');
        const multiplierButton = document.getElementById('activateMultiplier');
        
        if (shieldButton) shieldButton.disabled = this.powerups.shield === 0;
        if (multiplierButton) multiplierButton.disabled = this.powerups.multiplier === 0;
    }
///////////////////Koniec GRY///////////////////
    gameOver() {
        this.isGameOver = true;
        this.gameOverElement.classList.remove('hidden');
        
        if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500]);
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        
        this.totalCoins += this.coinsCollected;
        this.savePlayerData();
        
        const gameOverText = document.getElementById('gameOverText');
        gameOverText.innerHTML = `Twój wynik: <span id="finalScore">${this.score}</span> | Zebrane monety: <span id="finalCoins">${this.coinsCollected}</span>`;
    }
//////////////////////////////////////////GLOWNA PETAL GRY//////////////////////////////////////////////////////////////
    gameLoop(timestamp) {
        
        if (!this.isInMenu) {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(timestamp, deltaTime);
            this.draw();
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    loadSelectedSkin() {
        const selectedSkin = Object.values(this.skins).find(skin => skin.selected) || this.skins.knight;
        
        this.playerSprite = new Image();
        this.playerSprite.src = selectedSkin.sprite;
        this.frameWidth = selectedSkin.frameWidth;
        this.frameHeight = selectedSkin.frameHeight;
        this.frameCount = selectedSkin.frameCount;
        
        // Aktualizacja wymiarów wizualnych gracza
        if (this.player) {
            this.player.visualWidth = selectedSkin.visualWidth;
            this.player.visualHeight = selectedSkin.visualHeight;
            // Aktualizacja hitboxa (40% szerokości i 80% wysokości)
            this.player.width = selectedSkin.visualWidth * 0.4;
            this.player.height = selectedSkin.visualHeight * 0.8;
            // Aktualizacja pozycji Y aby postać stała na ziemi
            this.player.y = this.groundLevel - selectedSkin.visualHeight;
        }
        
        this.spriteFrame = 0;
        this.animationSpeed = 100;
        this.lastFrameUpdate = 0;
    }

    selectSkin(skinName) {
        if (!this.skins[skinName] || !this.skins[skinName].purchased) return;

        // Odznacz wszystkie skiny
        Object.values(this.skins).forEach(skin => skin.selected = false);
        
        // Zaznacz wybrany skin
        this.skins[skinName].selected = true;
        
        // Załaduj nowy skin
        this.loadSelectedSkin();
        
        // Aktualizuj przyciski
        this.updateSkinButtons();
    }

    buySkin(skinName, cost) {
        if (!this.skins[skinName] || this.skins[skinName].purchased) return;
        
        if (this.totalCoins >= cost) {
            this.totalCoins -= cost;
            this.skins[skinName].purchased = true;
            
            // Załaduj nowy skin
            this.loadSelectedSkin();
            
            // Aktualizuj wyświetlanie
            this.showShop();
        }
    }

    updateSkinButtons() {
        Object.keys(this.skins).forEach(skinKey => {
            const skin = this.skins[skinKey];
            const button = document.getElementById(`select${skinKey.charAt(0).toUpperCase() + skinKey.slice(1)}`);
            if (button) {
                if (skin.purchased) {
                    button.textContent = skin.selected ? 'Wybrany' : 'Wybierz';
                    button.className = `shop-button${skin.selected ? ' selected' : ''}`;
                } else {
                    button.textContent = `Kup (500 🪙)`;
                    button.className = 'shop-button';
                }
            }
        });
    }

    loadSelectedEnemySkin() {
        const selectedEnemySkin = Object.values(this.enemySkins).find(skin => skin.selected) || this.enemySkins.skeleton;
        
        const newEnemySprite = new Image();
        newEnemySprite.src = selectedEnemySkin.sprite;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        newEnemySprite.onload = () => {
            this.enemySprite = newEnemySprite;
            this.enemyFrameWidth = selectedEnemySkin.frameWidth;
            this.enemyFrameHeight = selectedEnemySkin.frameHeight;
            this.enemyFrameCount = selectedEnemySkin.frameCount;
            this.enemyVisualWidth = selectedEnemySkin.visualWidth;
            this.enemyVisualHeight = selectedEnemySkin.visualHeight;
            this.enemyFrame = 0;
            this.enemyAnimationSpeed = 50;
            this.lastEnemyFrameUpdate = 0;

            
            this.obstacles = [];
        };
    }

    selectEnemySkin(skinName) {
        if (!this.enemySkins[skinName] || !this.enemySkins[skinName].purchased) return;

        // Odznacz wszystkie skiny przeciwników
        Object.values(this.enemySkins).forEach(skin => skin.selected = false);
        
        // Zaznacz wybrany skin
        this.enemySkins[skinName].selected = true;
        
        // Załaduj nowy skin
        this.loadSelectedEnemySkin();
        
        // Aktualizuj przyciski
        this.updateEnemySkinButtons();
    }

    buyEnemySkin(skinName, cost) {
        if (!this.enemySkins[skinName] || this.enemySkins[skinName].purchased) return;
        
        if (this.totalCoins >= cost) {
            this.totalCoins -= cost;
            this.enemySkins[skinName].purchased = true;
            
            // Załaduj nowy skin
            this.loadSelectedEnemySkin();
            
            // Aktualizuj wyświetlanie
            this.showShop();
        }
    }

    updateEnemySkinButtons() {
        Object.keys(this.enemySkins).forEach(skinKey => {
            const skin = this.enemySkins[skinKey];
            const button = document.getElementById(`select${skinKey.charAt(0).toUpperCase() + skinKey.slice(1)}`);
            if (button) {
                if (skin.purchased) {
                    button.textContent = skin.selected ? 'Wybrany' : 'Wybierz';
                    button.className = `shop-button${skin.selected ? ' selected' : ''}`;
                } else {
                    button.textContent = `Kup (300 🪙)`;
                    button.className = 'shop-button';
                }
            }
        });
    }

    loadSelectedBackground() {
        const selectedBackground = Object.values(this.backgrounds).find(bg => bg.selected) || this.backgrounds.default;
        
        // Save the selected background to localStorage for persistence
        localStorage.setItem('selectedBackground', JSON.stringify({
            name: selectedBackground.name,
            sprite: selectedBackground.sprite,
            selected: true
        }));
        
        this.backgroundImage = new Image();
        this.backgroundImage.src = selectedBackground.sprite;
        this.backgroundImage.onload = () => {
            const aspectRatio = this.backgroundImage.width / this.backgroundImage.height;
            this.backgroundHeight = this.canvas.height;
            this.backgroundWidth = this.backgroundHeight * aspectRatio;
            this.backgroundY = 0;
        };
    }

    selectBackground(bgName) {
        if (!this.backgrounds[bgName] || !this.backgrounds[bgName].purchased) return;

        // Odznacz wszystkie tła
        Object.values(this.backgrounds).forEach(bg => bg.selected = false);
        
        // Zaznacz wybrane tło
        this.backgrounds[bgName].selected = true;
        
        // Załaduj nowe tło
        this.loadSelectedBackground();
        
        // Aktualizuj przyciski
        this.updateBackgroundButtons();
        
        // Save player data to persist the selection
        this.savePlayerData();
    }

    buyBackground(bgName, cost) {
        if (!this.backgrounds[bgName] || this.backgrounds[bgName].purchased) return;
        
        if (this.totalCoins >= cost) {
            this.totalCoins -= cost;
            this.backgrounds[bgName].purchased = true;
            
            // Załaduj nowe tło
            this.loadSelectedBackground();
            
            // Aktualizuj wyświetlanie
            this.showShop();
        }
    }

    updateBackgroundButtons() {
        Object.keys(this.backgrounds).forEach(bgKey => {
            const bg = this.backgrounds[bgKey];
            const button = document.getElementById(`select${bgKey.charAt(0).toUpperCase() + bgKey.slice(1)}Bg`);
            if (button) {
                if (bg.purchased) {
                    button.textContent = bg.selected ? 'Wybrany' : 'Wybierz';
                    button.className = `shop-button${bg.selected ? ' selected' : ''}`;
                } else {
                    button.textContent = `Kup (400 🪙)`;
                    button.className = 'shop-button';
                }
            }
        });
    }

    async savePlayerData() {
        try {
            const playerData = {
                highScore: this.highScore,
                totalCoins: this.totalCoins,
                purchasedUpgrades: this.purchasedUpgrades,
                powerups: this.powerups,
                purchasedSkins: this.getSkinsPurchaseData(this.skins),
                purchasedEnemySkins: this.getSkinsPurchaseData(this.enemySkins),
                purchasedBackgrounds: this.getSkinsPurchaseData(this.backgrounds)
            };

            const response = await fetch(`http://localhost:3000/api/player/${this.playerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData)
            });

            if (!response.ok) {
                throw new Error('Failed to save player data');
            }
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }

    getSkinsPurchaseData(skinsObject) {
        const purchaseData = {};
        Object.keys(skinsObject).forEach(key => {
            purchaseData[key] = {
                purchased: skinsObject[key].purchased,
                selected: skinsObject[key].selected
            };
        });
        return purchaseData;
    }
}

// Rozpoczęcie gry po załadowaniu strony
window.addEventListener('load', () => {
    new Game();
}); 