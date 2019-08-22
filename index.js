window.onload = function(){
	init()
}
var canvas, stage, exportRoot, anim_container, dom_overlay_container, fnStartAnimation;
function init() {
	canvas = document.getElementById("canvas");
	anim_container = document.getElementById("animation_container");
	dom_overlay_container = document.getElementById("dom_overlay_container");
	var comp=AdobeAn.getComposition("E66535A8C7D0401BA75CA88C06E8BA50");
	var lib=comp.getLibrary();
	var loader = new createjs.LoadQueue(false);
	loader.addEventListener("fileload", function(evt){handleFileLoad(evt,comp)});
	loader.addEventListener("complete", function(evt){handleComplete(evt,comp)});
	var lib=comp.getLibrary();
	loader.loadManifest(lib.properties.manifest);
}
function handleFileLoad(evt, comp) {
	var images=comp.getImages();	
	if (evt && (evt.item.type == "image")) { images[evt.item.id] = evt.result; }	
}
function handleComplete(evt,comp) {
	//This function is always called, irrespective of the content. You can use the variable "stage" after it is created in token create_stage.
	var lib=comp.getLibrary();
	var ss=comp.getSpriteSheet();
	var queue = evt.target;
	var ssMetadata = lib.ssMetadata;
	for(i=0; i<ssMetadata.length; i++) {
		ss[ssMetadata[i].name] = new createjs.SpriteSheet( {"images": [queue.getResult(ssMetadata[i].name)], "frames": ssMetadata[i].frames} )
	}
	exportRoot = new lib.spartan();
	stage = new lib.Stage(canvas);
	
	// 遊戲引擎基礎設定
	var spartan = exportRoot.content.userSpartan
	var gameBG = exportRoot.content.gamebackground

	// 音樂
	var bgm = new Audio("music/gameBGM.mp3")
	var UserSkill = new Audio("music/samurai_shouting1.mp3")
	var UserAttack = new Audio("music/stabbing.mp3")
	var monsterSong = new Audio("music/monster_roaning3.mp3")
	var dieSong = new Audio("music/die.wav")
	var monsterDama = new Audio("music/damage2.mp3")
	var swing = new Audio("music/swing.mp3")
	var giantfootstep = new Audio("music/footsteps_of_a_giant.mp3")
	var bossfight = new Audio("music/bossfight.mp3")
	var giantVoice1 = new Audio("music/giant_voice1.mp3")
	var giantVoice2 = new Audio("music/giant_voice2.mp3")
	var giantVoice3 = new Audio("music/giant_voice3.mp3")
	var giantVoice4 = new Audio("music/giant_voice4.mp3")
	var winBGM = new Audio("music/win.mp3")
	var getDama = new Audio("music/getDama.mp3")
	var block = new Audio("music/block.mp3")

	monsterDama.volume = 0.5
	monsterSong.volume = 0.5
	bgm.volume = 0.5

	// 用到的按鈕
	var keyD = false
	var keyA = false
	var keyQ = false
	var keyE = false

	// 基礎數值
	var userLife = 10 // 玩家生命值
	var back = 5
	var front = 8
	var killMonsterNum = 0
	var isBlock = false 
	var userDama = 1
	let pwAdd = 0
	var timeLimited = 0
	
	// 怪獸設定
	var monster// 怪物的變數
	var monsterStep// 怪物走路速度的變數
	var madeMonster// 製造怪的interval變數
	var monsterLife = 0
	var atkSpeed = 1550
	var monsterNum = 30
	// boss設定
	var giant = new lib.giant()
	exportRoot.addChild(giant)
	giant.x = 1080
	giant.y = 280
	var giantStep = 5
	var bossLife = 0
	var isBoss = false
	
	

	// // 鍵盤壓
	function keydwonFuntion(e){
		if(keyD || keyA || keyQ) {return}
		if(e.keyCode == 68){
			if(!keyE){
				keyD = true
				spartan.gotoAndPlay("start_moving")
			}
		}
		if(e.keyCode == 65){
			if(!keyE){
				keyA = true
				spartan.gotoAndPlay("start_moving")
			}
		}
		if(e.keyCode == 81){
			if(!keyE && pwAdd == 5){
				keyQ = true
				UserSkill.play()
				pwAdd = 6
				userLife += 5
				spartan.gotoAndPlay("nirvana")
				document.getElementById("powerLineFrame").classList.remove("kill-1","kill-2","kill-3","kill-4","kill-5")
				document.getElementById("powerLineFrame").classList.add("kill-power")
			}
		}
		if(e.keyCode == 69) {
			isBlock = !isBlock
			if(isBlock){
				keyE = true
				spartan.gotoAndPlay("block")
				swing.play()
			}
			if(!isBlock){
				keyE = false
				spartan.gotoAndPlay("unblock")
				swing.play()
			}
		}
	}

	// 鍵盤起
	function keyupFuntion(){
		if(keyD){
			keyD = false
			spartan.gotoAndPlay("0")
		}
		if(keyA){
			keyA = false
			spartan.gotoAndPlay("0")
		}
		if(keyQ){
			setTimeout(function(){
				keyQ = false
				spartan.gotoAndPlay("0")
				userDama = 2
			},300)
			setTimeout(function(){
				document.getElementById("powerLineFrame").classList.remove("kill-power")
				userDama = 1
				pwAdd = 0
			},10300)
		}
	}
	var isFront = false
	// ticker監聽
	function tickFuntion(){
		if(keyD){
			if(killMonsterNum != monsterNum) {
				gameBG.x -= front
			}
			if(gameBG.x < 50){
				gameBG.x = 800
			}
			if(spartan.x < 680 && isFront){
				spartan.x += front
			}
		}
		if(keyA){
			if(spartan.x > 110){
				spartan.x -= back
				if(gameBG.x < 790 && killMonsterNum != monsterNum){
					gameBG.x += back
				}
			}
		}
		document.getElementById("userLife").innerHTML = userLife
		document.getElementById("killMonster").innerHTML = killMonsterNum
	}

	// 製造怪物
	function madeMonster(num){
		monsterSong.play()
		monster = new lib.monster()
		exportRoot.addChild(monster)
		monster.x = 850
		monster.y = 330
		monsterStep = num
		monsterLife += num
		monsterAction(monster,monsterStep)
	}

	// 怪物動作
	function monsterAction(obj,objStep){
		// 移動
		let monsterMoving = setInterval(function(){
			let monsterCloseDistance = spartan.x * 1.3
			let PaN
			if(obj.x < monsterCloseDistance) {
				PaN = 0
				isFront = false
			}
			if(obj.x > monsterCloseDistance) {
				PaN = 1
				isFront = true
			}
			obj.x -= objStep * PaN
		},50)
		// 攻擊
		let monsterAttack = setInterval(function(){
			let monsterAttackDistance = spartan.x+200
			let nowGameBG = gameBG.x
			if(obj.x < monsterAttackDistance) {
				obj.gotoAndPlay("monster_attack")
				monsterDama.play()
				if(keyE){
					block.play()
				}
				if(!keyE) {
					getDama.play()
					userLife -= 1
					spartan.alpha = 0.8
					setTimeout(function(){
						spartan.alpha = 1
					},200)
					if(nowGameBG < 790){
						spartan.x -= 10
					}
				}
			}
			if(userLife <= 0){
				userLife = 0
				obj.stop()
				clearInterval(madeMonster)
				clearInterval(monsterMoving)
				clearInterval(monsterAttack)
				gameOver()
			}
		},atkSpeed)
		// 死亡判斷
		setInterval(function(){
			if(monsterLife <= 0){
				clearInterval(monsterMoving)
				clearInterval(monsterAttack)
				monster.stop()
				monster.alpha = 0.5
				setTimeout(function(){exportRoot.removeChild(obj)},1000)
			}
		})
		var reMade = setInterval(function(){
			if(isBoss){
				clearInterval(reMade)
				return
			}
			if(monsterLife <= 0){
				var add = Math.floor(Math.random()*6+3)
				if(atkSpeed > 350) {
					atkSpeed -= 100 
				}
				if(pwAdd < 5){
					if(killMonsterNum == monsterNum){
						return
					}
					pwAdd += 1
					document.getElementById("powerLineFrame").classList.remove("kill-1","kill-2","kill-3","kill-4","kill-5")
					document.getElementById("powerLineFrame").classList.add("kill-"+pwAdd)
				}
				if(killMonsterNum < monsterNum - 1){
					madeMonster(add)
				}
				if(killMonsterNum < monsterNum) {
					killMonsterNum +=1
				}
			}
			if(killMonsterNum == monsterNum){
				isBoss = true
				isFront = true
				BGMfadeOut(bgm)
				document.getElementById("killMonsterFrame").style.opacity = "0"
				setTimeout(function(){
					giantAction(giant,giantStep)
				},5000)
			}
		},2000)
	}

	// boss動作	
	function giantAction(obj,objstep){
		// 進入戰鬥前
		setTimeout(function(){
			obj.gotoAndPlay("moving")
		},1500)
		let movingSetting = setInterval(function(){
			giantfootstep.play()
			let keepmoving = setInterval(function(){
				obj.x -= objstep
			},50)
			setTimeout(function(){
				clearInterval(keepmoving)
			},1500)
		},3000)
		setTimeout(function(){
			giantVoice1.play()
			obj.gotoAndPlay("thisStop")
			clearInterval(movingSetting)
		},9050)

		// 進入戰鬥
		setTimeout(function(){
			// 戰鬥bgm
			bossfight.play()
			bossLife += 600
			// 限時倒數
			timeLimited += 150
			let level1countdown = setInterval(function(){
				if(bossLife <= 0){
					clearInterval(level1countdown)
					return
				}
				timeLimited -= 1
				if(timeLimited <= 0){
					finish(obj)
					clearInterval(level1countdown)
				}
			},1000)
			// 戰鬥判定
			let userPos = setInterval(function(){
				if(userLife <= 0){
					clearInterval(userPos)
					return
				}
				let atkDistance = spartan.x + 100
				if(obj.x < atkDistance){
					isFront = false
				}
				if(obj.x > atkDistance){
					isFront = true
				}
				if(bossLife <= 0){
					isFront = true
					giantVoice3.play()
					obj.gotoAndPlay("die")
					BGMfadeOut(bossfight)
					clearInterval(userPos)
					setTimeout(youwin,5000)
					return
				}

			})
			// 第一階段攻擊
			let movingSetting = setInterval(function(){
				if(timeLimited <= 0){
					clearInterval(movingSetting)
					return
				}
				let atkDistance = spartan.x + 100
				if(obj.x < atkDistance){
					obj.gotoAndPlay("attack")
					setTimeout(function(){
						giantVoice2.play()
						if(keyE){
							block.play()
						}
						if(!keyE){
							getDama.play()
							userLife -= 8
							spartan.alpha = 0.8
							setTimeout(function(){
								spartan.alpha = 1
							},500)
							if(userLife <= 0){
								userLife = 0
								obj.stop()
								gameOver()
								clearInterval(movingSetting)
							}
						}
					},1000)
				}
				if(obj.x > atkDistance){
					obj.gotoAndPlay("moving")
					setTimeout(function(){
						giantfootstep.play()
					},1000)
				}
				let keepmoving = setInterval(function(){
					let atkDistance = spartan.x + 100
					if(obj.x < atkDistance){
						obj.x -= objstep * 0
					}
					if(obj.x > atkDistance){
						obj.x -= objstep * 1
					}
				},50)
				setTimeout(function(){
					clearInterval(keepmoving)
				},1500)
			},3000)

			let intoLevel2 = setInterval(function(){
				if(bossLife < 400){
					giantVoice1.play()
					obj.gotoAndPlay("stay")
					level2()
					clearInterval(movingSetting)
					clearInterval(intoLevel2)
				}
			})
		},13000)

		// 第二階段
		function level2() {
			// 氣力增加
			var isPower = document.getElementById("powerLineFrame").classList.contains("kill-power")
			if(!isPower){
				document.getElementById("powerLineFrame").classList.add("kill-1")
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-2")},500)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-3")},1000)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-4")},1500)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-5")
				pwAdd=5},2000)
			}

			let goback = setInterval(function(){
				if(obj.x >= 630){
					clearInterval(goback)
				}
				if(obj.x < 630){
					obj.x += objstep
				}
			},50)

			// 第二階段攻擊
			let smashAttack = setInterval(function(){
				if(timeLimited <= 0){
					clearInterval(smashAttack)
					return
				}
				obj.gotoAndPlay("smashAttack")
				setTimeout(function(){
					let back = setInterval(function(){
						if(spartan.x > 110){
							spartan.x -= 6
						}
					},50)
					giantVoice4.play()
					if(keyE){
						block.play()
					}
					if(!keyE){
						getDama.play()
						userLife -= 5
						spartan.alpha = 0.8
						setTimeout(function(){
							spartan.alpha = 1
						},500)
						if(userLife <= 0){
							userLife = 0
							obj.stop()
							gameOver()
							clearInterval(back)
							clearInterval(smashAttack)
						}
					}
					setTimeout(function(){
						clearInterval(back)
					},2000)
				},240)
			},4000)
			let intoLevel3 = setInterval(function(){
				if(bossLife < 200){
					giantVoice1.play()
					obj.gotoAndPlay("stay")
					level3()
					clearInterval(smashAttack)
					clearInterval(intoLevel3)
				}
			})
		}

		// 第三階段
		function level3(){
			// 氣力增加
			var isPower = document.getElementById("powerLineFrame").classList.contains("kill-power")
			if(!isPower){
				document.getElementById("powerLineFrame").classList.add("kill-1")
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-2")},500)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-3")},1000)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-4")},1500)
				setTimeout(function(){document.getElementById("powerLineFrame").classList.add("kill-5")
				pwAdd=5},2000)
			}

			// 第三階段攻擊
			let finalMovingSetting = setInterval(function(){
				if(bossLife <= 0 || timeLimited <= 0){
					clearInterval(finalMovingSetting)
					return
				}
				let atkDistance = spartan.x + 100
				if(obj.x < atkDistance){
					obj.gotoAndPlay("threeAttack")
					setTimeout(function(){
						giantVoice2.play()
						if(keyE){
							block.play()
						}
						if(!keyE){
							getDama.play()
							userLife -= 10
							spartan.alpha = 0.8
							setTimeout(function(){
								spartan.alpha = 1
							},500)
							if(userLife <= 0){
								userLife = 0
								obj.stop()
								gameOver()
								clearInterval(finalMovingSetting)
							}
						}
					},160)
				}
				if(obj.x > atkDistance){
					obj.gotoAndPlay("moving")
					setTimeout(function(){
						giantfootstep.play()
					},1000)
				}
				let finalKeepmoving = setInterval(function(){
					let atkDistance = spartan.x + 100
					if(obj.x < atkDistance){
						obj.x -= objstep * 0
					}
					if(obj.x > atkDistance){
						obj.x -= objstep * 1 + 5
					}
				},50)
				setTimeout(function(){
					clearInterval(finalKeepmoving)
				},1500)
			},3000)
		}
	}

	// 時間到遊戲結束
	function finish(obj){
		giantVoice1.play()
		obj.gotoAndPlay("finish")
		let finishMoving = setInterval(function(){
			if(obj.x < spartan.x){
				clearInterval(finishMoving)
				return
			}
			if(obj.x > spartan.x){
				obj.x -= 5
			}
		},10)
		setTimeout(function(){
			giantfootstep.play()
			userLife = 0
			gameOver()
			clearInterval(back)
			clearInterval(smashAttack)
		},600)
	}

	// 勝利遊戲結束
	function youwin(){
		winBGM.play()
		setTimeout(function(){
			document.getElementById("youwin").style.display="block"
			document.getElementById("winFont").classList.add("active")
		},3000)
		setTimeout(function(){
			document.getElementById("gameOver").style.display = "block"
		},6000)
	}

	// 音效淡出
	function BGMfadeOut(music){
		let fadeOut = setInterval(function(){
			if(music.volume < 0.02){
				music.volume = 0
				clearInterval(fadeOut)
				return
			}
			music.volume -= 0.01
		},100)
	}

	// 玩家設定
	// 回血
	var restoreLife = setInterval(function(){
		if(userLife <= 0){
			clearInterval(restoreLife)
		}
		if(userLife < 10 && userLife >0 && keyE){
			userLife +=1
		}
	},3000)
	// 人物攻擊
	function attackClick(){
		let attackDistance = spartan.x + 200
		if(!keyA && !keyD && !keyE){
			spartan.gotoAndPlay("attack")
			setTimeout(function(){
				UserAttack.play()
			},250)
			if(attackDistance > monster.x){
				if(monsterLife > 0){
					monsterLife -= userDama
				}
				setTimeout(function(){
					monster.alpha = 0.8
					monster.x += 5
					setTimeout(function() {
						monster.alpha = 1
					},200)
				},600)
			}
			if(attackDistance > giant.x){
				if(bossLife > 0){
					bossLife -= userDama
					setTimeout(function(){
						giant.alpha = 0.8
						setTimeout(function() {
							giant.alpha = 1
						},200)
					},600)
				}
			}
		}
	}

	// 遊戲開始 
	function gameStart(){
		// 監聽事件
		window.addEventListener("keydown",keydwonFuntion)
		window.addEventListener("keyup",keyupFuntion)
		createjs.Ticker.addEventListener("tick",tickFuntion)
		document.getElementById("gameStartBtn").style.display = "none"
		document.getElementById("spartanlogo").style.display = "none"
		document.getElementById("guideBtn").style.display = "none"
		setTimeout(() => {
			window.addEventListener('click',attackClick)
		}, 500);
		document.getElementById("powerLineFrame").style.opacity = "1"
		document.getElementById("killMonsterFrame").style.opacity = "1"
		document.getElementById("userLifeFrame").style.opacity = "1"
	}
	document.getElementById("gameStartBtn").addEventListener('click',function(){
		gameStart()
		madeMonster(3)
		bgm.play()
	})

	// 遊戲結束事件
	function gameOver() {
		spartan.gotoAndPlay("die")
		dieSong.play()
		window.removeEventListener("tick",tickFuntion)
		window.removeEventListener("keydown",keydwonFuntion)
		window.removeEventListener("keyup",keyupFuntion)
		window.removeEventListener('click',attackClick)
		setTimeout(function(){
			document.getElementById("gameOver").style.display = "block"
			bgm.pause()
			bossfight.pause()
		},1500)
	}

	document.getElementById("gameOverbtn").addEventListener("click",function(){
		window.location.reload()
	})

	// 規則查看
	document.getElementById("guideBtn").addEventListener("click",function(){
		document.getElementById("gameRules").style.display = "block"
	})
	document.getElementById("rulesClose").addEventListener("click",function(){
		document.getElementById("gameRules").style.display = "none"
	})
	
	//Registers the "tick" event listener.
	fnStartAnimation = function() {
		stage.addChild(exportRoot);
		createjs.Ticker.setFPS(lib.properties.fps);
		createjs.Ticker.addEventListener("tick", stage)
		stage.addEventListener("tick", handleTick)
		function getProjectionMatrix(container, totalDepth) {
			var focalLength = 528.25;
			var projectionCenter = { x : lib.properties.width/2, y : lib.properties.height/2 };
			var scale = (totalDepth + focalLength)/focalLength;
			var scaleMat = new createjs.Matrix2D;
			scaleMat.a = 1/scale;
			scaleMat.d = 1/scale;
			var projMat = new createjs.Matrix2D;
			projMat.tx = -projectionCenter.x;
			projMat.ty = -projectionCenter.y;
			projMat = projMat.prependMatrix(scaleMat);
			projMat.tx += projectionCenter.x;
			projMat.ty += projectionCenter.y;
			return projMat;
		}
		function handleTick(event) {
			var cameraInstance = exportRoot.___camera___instance;
			if(cameraInstance !== undefined && cameraInstance.pinToObject !== undefined)
			{
				cameraInstance.x = cameraInstance.pinToObject.x + cameraInstance.pinToObject.pinOffsetX;
				cameraInstance.y = cameraInstance.pinToObject.y + cameraInstance.pinToObject.pinOffsetY;
				if(cameraInstance.pinToObject.parent !== undefined && cameraInstance.pinToObject.parent.depth !== undefined)
				cameraInstance.depth = cameraInstance.pinToObject.parent.depth + cameraInstance.pinToObject.pinOffsetZ;
			}
			applyLayerZDepth(exportRoot);
		}
		function applyLayerZDepth(parent)
		{
			var cameraInstance = parent.___camera___instance;
			var focalLength = 528.25;
			var projectionCenter = { 'x' : 0, 'y' : 0};
			if(parent === exportRoot)
			{
				var stageCenter = { 'x' : lib.properties.width/2, 'y' : lib.properties.height/2 };
				projectionCenter.x = stageCenter.x;
				projectionCenter.y = stageCenter.y;
			}
			for(child in parent.children)
			{
				var layerObj = parent.children[child];
				if(layerObj == cameraInstance)
					continue;
				applyLayerZDepth(layerObj, cameraInstance);
				if(layerObj.layerDepth === undefined)
					continue;
				if(layerObj.currentFrame != layerObj.parent.currentFrame)
				{
					layerObj.gotoAndPlay(layerObj.parent.currentFrame);
				}
				var matToApply = new createjs.Matrix2D;
				var cameraMat = new createjs.Matrix2D;
				var totalDepth = layerObj.layerDepth ? layerObj.layerDepth : 0;
				var cameraDepth = 0;
				if(cameraInstance && !layerObj.isAttachedToCamera)
				{
					var mat = cameraInstance.getMatrix();
					mat.tx -= projectionCenter.x;
					mat.ty -= projectionCenter.y;
					cameraMat = mat.invert();
					cameraMat.prependTransform(projectionCenter.x, projectionCenter.y, 1, 1, 0, 0, 0, 0, 0);
					cameraMat.appendTransform(-projectionCenter.x, -projectionCenter.y, 1, 1, 0, 0, 0, 0, 0);
					if(cameraInstance.depth)
						cameraDepth = cameraInstance.depth;
				}
				if(layerObj.depth)
				{
					totalDepth = layerObj.depth;
				}
				//Offset by camera depth
				totalDepth -= cameraDepth;
				if(totalDepth < -focalLength)
				{
					matToApply.a = 0;
					matToApply.d = 0;
				}
				else
				{
					if(layerObj.layerDepth)
					{
						var sizeLockedMat = getProjectionMatrix(parent, layerObj.layerDepth);
						if(sizeLockedMat)
						{
							sizeLockedMat.invert();
							matToApply.prependMatrix(sizeLockedMat);
						}
					}
					matToApply.prependMatrix(cameraMat);
					var projMat = getProjectionMatrix(parent, totalDepth);
					if(projMat)
					{
						matToApply.prependMatrix(projMat);
					}
				}
				layerObj.transformMatrix = matToApply;
			}
		}
	}	    
	//Code to support hidpi screens and responsive scaling.
	function makeResponsive(isResp, respDim, isScale, scaleType) {		
		var lastW, lastH, lastS=1;		
		window.addEventListener('resize', resizeCanvas);		
		resizeCanvas();		
		function resizeCanvas() {			
			var w = lib.properties.width, h = lib.properties.height;			
			var iw = window.innerWidth, ih=window.innerHeight;			
			var pRatio = window.devicePixelRatio || 1, xRatio=iw/w, yRatio=ih/h, sRatio=1;			
			if(isResp) {                
				if((respDim=='width'&&lastW==iw) || (respDim=='height'&&lastH==ih)) {                    
					sRatio = lastS;                
				}				
				else if(!isScale) {					
					if(iw<w || ih<h)						
						sRatio = Math.min(xRatio, yRatio);				
				}				
				else if(scaleType==1) {					
					sRatio = Math.min(xRatio, yRatio);				
				}				
				else if(scaleType==2) {					
					sRatio = Math.max(xRatio, yRatio);				
				}			
			}			
			canvas.width = w*pRatio*sRatio;			
			canvas.height = h*pRatio*sRatio;
			canvas.style.width = dom_overlay_container.style.width = anim_container.style.width =  w*sRatio+'px';				
			canvas.style.height = anim_container.style.height = dom_overlay_container.style.height = h*sRatio+'px';
			stage.scaleX = pRatio*sRatio;			
			stage.scaleY = pRatio*sRatio;			
			lastW = iw; lastH = ih; lastS = sRatio;            
			stage.tickOnUpdate = false;            
			stage.update();            
			stage.tickOnUpdate = true;		
		}
	}
	makeResponsive(false,'both',false,1);	
	AdobeAn.compositionLoaded(lib.properties.id);
	fnStartAnimation();
}