//variables for size of the board.
var zoom=0.7;//use that to change the perceived size of the tiles.
//var windColor="#FFFAF0";
var energyEconomy=false;

if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
	zoom=1.5;
	energyEconomy=true;
}

var speedAdjust=1.3;//0.5

var fuelConsumption=1;
var fuelMax=2000;
//var thrust=0.002*speedAdjust;
var thrust=0.001*speedAdjust;

var k=1*speedAdjust; //gravitational constant

var speed=1;

var livesLeft=3;

var tapsOn=true;
var speedOn=1;
var bounceOn=true;

var counterSp=1;
var sp=1;

var gridSize=1000;
var starGridSize=300;

var fuelStart=fuelMax;
var fuelConsumption=0.2;
var averageFuel=1000;

var power=3;//3
var adjust=1;//1
//var power=2; var adjust=100;

var ratioCompass=1000;

var numberOfShips=2;

var startLevelRadius=50;
var planetRadius=30;

var keysDown = {};

var cameraSpeed=1;

var spaceshipRadius=3;
var spaceshipWeight=1;
var friction=0.001; //0.002

var distancePointer=15;
var lengthPointer=25;

var dotLength=Math.floor(50/speedAdjust);

var planetWeight=10;

var marginOrbiting=150;
var minTimeOrbit=2000;

var marginSoftCamera=0.35;

var score=0;

var refreshRate=10;

function init() {
	initScenario1();
	initShip1();
}

var colorArray=["#1abc9c","#2ecc71","#3498db","#e67e22","#d35400","#e74c3c","#2980b9","#34495e"];
var colorStartLevel="#f1c40f";
var colorOrbit="#2c3e50";
var colorBonus="#9b59b6";

// Create the canvas
var canvas = document.createElement("canvas");
canvas.style.border = "none";
//document.documentElement.requestFullscreen();

var cxt = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var marginHeight=canvas.height*marginSoftCamera;
var marginWidth=canvas.width*marginSoftCamera;

document.body.appendChild(canvas);

var currentlyPlaying=true; //change that to pause the game.


window.onscroll = function () { window.scrollTo(0, 0); };//prevent the screen from scrolling.

var shipTable=new Array();
var levelTable=new Array();
var currentLevel;
var planetTable;
var objectTable;
var currentLevelIndex=0; //Store this for people that are moving through the map

function level() {
	this.planetTable=new Array(); //list the planets in the level. Includes the bonuses?
	this.bonusTable=new Array(); //List fuel and other bonuses
	this.targetLevelTable=new Array();// a list of other levels, maybe expressed as an index in levelTable
	this.fuelMax=2000; //some levels might require lower fuel to be fun
	this.fuelStart=1000;
	this.levelNumber;
	this.numberOfMissions=0;
	this.maxNumberOfMissions=0;
	this.lives=0;


	//add a lot of attributes for best score for this level

	this.reset=function() {
		// Put the ships back around the starting point
		planetTable=this.planetTable;
		for (var i=0;i<shipTable.length;i++) {
			var ship=shipTable[i];
			updateOrbit(ship.orbit,0,i*Math.PI/(2*shipTable.length),100,0,false); //distribute multiple ships around the starting planet
			ship.orbiting=true;
			ship.currentlyTestingOrbit=false;
			if (ship.dotTable) ship.dotTable.length=0;
			ship.fuel=this.fuelStart;
			//need to reset the dots?
		}
		// reset the bonuses and missions
		for (var i=0;i<this.planetTable.length;i++) {
   			var object=this.planetTable[i];
      		if (object.target)	{
      			object.activeTarget=true;
      		}
			if (object.mission) {
				object.missionAccomplished=false;
			}
			object.testingOrbit=false;
		}
		// resets the missions


		this.numberOfMissions=0;
	}

}

var timeResetLevel;
var startLevelTimer=Date.now();


function resetLevel(level) {
	//planetTable=this.planetTable;
	displayingStartLevel=true;
	startLevelTimer=Date.now();
	currentLevelIndex=level.planetTable[0].levelIndex;
	xo=level.planetTable[0].xx-canvas.width/(2*zoom);
	yo=level.planetTable[0].yy-canvas.height/(2*zoom);
	currentLevel=level;

	planetTable=level.planetTable;
	for (var i=0;i<shipTable.length;i++) {
		var ship=shipTable[i];
		ship.lives=level.lives;
		updateOrbit(ship.orbit,0,i*Math.PI/(2*shipTable.length),planetTable[0].radius+marginOrbiting+10,0,false); //distribute multiple ships around the starting planet
		ship.orbiting=true;
		ship.currentlyTestingOrbit=false;
		if (ship.dotTable) ship.dotTable.length=0;
		ship.fuel=level.fuelStart;
		updatePosition(ship,0,0,level.planetTable);
		ship.timeEnterOrbit=Date.now()-minTimeOrbit-500;
		//need to reset the dots?
	}
	var bonusTable=level.bonusTable;
	for (var i=0;i<bonusTable.length;i++) {
		bonusTable[i].activeTarget=true;
	}
	// reset the bonuses and missions
	for (var i=0;i<level.planetTable.length;i++) {
		var object=level.planetTable[i];
  		if (object.target)	{
  			object.activeTarget=true;
  		}
		if (object.mission) {
			object.missionAccomplished=false;
		}
		object.testingOrbit=false;
	}
	// resets the missions
	level.numberOfMissions=0;
	objectTable=new Array();
	for (var k=0;k<planetTable.length;k++) {
		objectTable[k]=planetTable[k];
	}
	for (var j=0;j<currentLevel.targetLevelTable.length;j++) {
		//We add the destination planets to the list of planets that the ship is influenced by
		objectTable[planetTable.length+j]=levelTable[currentLevel.targetLevelTable[j]].planetTable[0];
		levelTable[currentLevel.targetLevelTable[j]].planetTable[0].testingOrbit=false;
	}
	for (var h=0;h<currentLevel.bonusTable.length;h++) {
		//We add the destination planets to the list of planets that the ship is influenced by
		objectTable[planetTable.length+currentLevel.targetLevelTable.length+h]=currentLevel.bonusTable[h];
	}


}

function planet(x,y,w,r,c,i,t) {
	this.xx=x;
	this.yy=y;
	this.vx=0;
	this.vy=0;
	this.ax=0;
	this.ay=0;

	this.testingOrbit=false;

	this.hardSurface=true;

	this.orbit=null;

	this.orbiting=false;

	this.inert=i;

	this.target=t;

	this.fuel=averageFuel;

	this.activeTarget=false;

	this.startLevel=false;

	this.levelIndex;//index of level in levelTable

	this.mission=false; //do you need to orbit around this planet to finish the level?

	this.missionAccomplished=false; //is the mission done?

	this.color=c;

	this.isShip=false;

	this.weight=w;
	this.radius=r;

	//planetTable[planetTable.length]=this; //need to remove this/

	this.draw=function(inCurrentLevel) {
		if (!(this.target && !this.activeTarget)) {  //do not display unactive targets
			cxt.beginPath();
			if (this.testingOrbit) {
				//a ship has entered the auto-pilot orbit zone. Display a circle to help him
				cxt.arc((this.xx-xo)*zoom,(this.yy-yo)*zoom,(this.radius+marginOrbiting)*zoom,0,2*Math.PI);
				cxt.fillStyle = colorOrbit;
				cxt.closePath();
				cxt.fill();

			}
			var co=this.color;
			if (!inCurrentLevel || ((this.missionAccomplished || !this.mission) && !this.startLevel)) co="#bdc3c7"; //planets only have their color while the mission still needs to be accomplished
			cxt.beginPath();
			cxt.arc((this.xx-xo)*zoom,(this.yy-yo)*zoom,this.radius*zoom,0,2*Math.PI);
			cxt.closePath();
			cxt.fillStyle = co;
			cxt.fill();
			//ctx.stroke();
		}
	}
}

function drawPlanet(planet,inCurrentLevel) {
	if (!(planet.target && !planet.activeTarget)) {  //do not display unactive targets
		cxt.beginPath();
		var co=planet.color;
		if (!inCurrentLevel || ((planet.missionAccomplished || !planet.mission) && !planet.startLevel  && !planet.target)) co="#7f8c8d"; //planets only have their color while the mission still needs to be accomplished
		if (planet.startLevel && currentlyPlaying && planet.levelIndex==currentLevelIndex) co="#7f8c8d";

		if (!renderSideCompass(planet,shipTable[0],co)) {
			//the planet is confirmed to be in the screen
			if (planet.testingOrbit && processEfficiency>70) {
				//a ship has entered the auto-pilot orbit zone. Display a circle to help him
				cxt.arc((planet.xx-xo)*zoom,(planet.yy-yo)*zoom,(planet.radius+marginOrbiting)*zoom,0,2*Math.PI);
				cxt.fillStyle = colorOrbit;
				cxt.closePath();
				cxt.fill();
			}
			if (!planet.target) {
				if (!planet.target && planet.orbiting && !energyEconomy) {
					//draw the orbit
					var orb=planet.orbit;
					var cent=levelTable[planet.levelIndex].planetTable[orb.center];
					cxt.beginPath();
					cxt.strokeStyle=co; //light grey
					cxt.lineWidth=zoom;
					cxt.arc((cent.xx-xo)*zoom,(cent.yy-yo)*zoom,orb.radius*zoom,0,2*Math.PI);
					cxt.closePath();
					cxt.stroke();
				}
				cxt.beginPath();
				cxt.arc((planet.xx-xo)*zoom,(planet.yy-yo)*zoom,planet.radius*zoom,0,2*Math.PI);
				cxt.closePath();
				cxt.fillStyle = co;
				cxt.fill();
				if (!planet.hardSurface) {
					//draw the rubber ring around the planet
					cxt.strokeStyle="#2c3e50";
					cxt.lineWidth=8*zoom;
					cxt.stroke();
				}

			}
			else {
				//cxt.beginPath();
				cxt.lineWidth=8*zoom;
				cxt.setLineDash([5]);
				cxt.arc((planet.xx-xo)*zoom,(planet.yy-yo)*zoom,planet.radius*zoom,0,2*Math.PI);
				cxt.strokeStyle = co;
				//cxt.closePath();
				cxt.stroke();
				cxt.setLineDash([]);
			}
		}

		//renderSideCompass(planet,shipTable[0],co);
		//ctx.stroke();
	}
}

function spaceShip(x,y,c) {
	this.xx=x;
	this.yy=y;
	this.vx=0;
	this.vy=0;
	this.ax=0;
	this.ay=0;

	this.timeEnterOrbit=0;
	this.currentlyTestingOrbit=false;

	this.orbit=null;

	this.dead=false;

	this.orbiting=true;

	this.lives=0;

	this.isShip=true;

	this.fuel=fuelStart;

	this.radius=spaceshipRadius;

	this.color=c;

	this.weight=spaceshipWeight;
	this.thrustOn=false;
	this.thrust=thrust;

	this.dotTable=new Array(dotLength);

	this.draw=function() {
		cxt.beginPath();
		cxt.arc((this.xx-xo)*zoom,(this.yy-yo)*zoom,this.radius,0,2*Math.PI);
		cxt.closePath();
		cxt.fillStyle = this.color;
		cxt.fill();
		drawDotTable(this.dotTable,this.color,dotLength,2);
		if (this.thrustOn) drawDotTable(this.dotTable,"#FFD700",50,4);

	}

	this.die=function() {
		//currentlyPlaying=false;
		this.currentlyTestingOrbit=false;
		this.orbit.center.testingOrbit=false;
		this.dotTable.length=0;
		initShip1();
		score=0;
		//ship=new spaceShip(600,200);
		//ship.vx=0.7;

	}

}

function orbit(center,teta,radius,tetaSpeed,clockwise) {
	//var planetTable=levelTable[currentLevelIndex].planetTable;
	this.center=center; //index in current level
	this.teta=teta;
	this.radius=radius;
	if (tetaSpeed==0){
		//the user hasn't specified tetaspeed. We assume that we need to find the circular orbit from planet mass
		this.tetaSpeed=Math.sqrt(k*planetTable[center].weight*spaceshipWeight/(Math.pow(radius,power)*adjust));
	}
	else this.tetaSpeed=tetaSpeed;
	this.clockwise=clockwise;

	this.update=function(center,teta,radius,tetaSpeed,clockwise) {
		this.center=center;
		this.teta=teta;
		this.radius=radius;
		if (tetaSpeed==0){
			//the user hasn't specified tetaspeed. We assume that we need to find the circular orbit from planet mass
			this.tetaSpeed=Math.sqrt(k*planetTable[center].weight*spaceshipWeight/(Math.pow(radius,power)*adjust));
		}
		else this.tetaSpeed=tetaSpeed;
		this.clockwise=clockwise;
	}
}

function updateOrbit(orbit,center,teta,radius,tetaSpeed,clockwise) {
	orbit.center=center;
	orbit.teta=teta;
	orbit.radius=radius;
	if (tetaSpeed==0){
		//the user hasn't specified tetaspeed. We assume that we need to find the circular orbit from planet mass
		orbit.tetaSpeed=Math.sqrt(k*Math.abs(planetTable[center]
			.weight)*spaceshipWeight/(Math.pow(radius,power)*adjust));
	}
	else orbit.tetaSpeed=tetaSpeed;
	orbit.clockwise=clockwise;
}

function dot(x,y) {
	this.xx=x;
	this.yy=y;
}

function addDot(ship) {
	//shifts all the dots and add
	var dotTable=ship.dotTable;
	for (var i=1;i<dotLength;i++) {
		dotTable[dotLength-i]=dotTable[dotLength-i-1];
	}
	dotTable[0]=new dot(ship.xx,ship.yy);
}


function deleteLevel(l) {
	//levelTable.splice(l, 1);
	//if (currentLevelIndex==l) currentLevelIndex--;
	var lev;
	//Remove the reference of this level in all other levels;
	var k=0;
	for (k;k<levelTable.length;k++) {
		lev=levelTable[k];
		var tar=lev.targetLevelTable;
		var u=tar.indexOf(l);
		if (u>-1) {
			tar.splice(u,1);
		}
	}
	levelTable[l].targetLevelTable=[];

}

function updateDotTable(dotTable,orbit) {
	//When a shpi is orbiting a moving object, we want to display a circle rather than a cycloide.
 	if (orbit.center<planetTable.length) {
		var orb=planetTable[orbit.center];
		for (var i=0;i<dotTable.length;i++) {
			var c=dotTable[i];
			if (orb.vx) {
				c.xx=c.xx+orb.vx*refreshRate;
				c.yy=c.yy+orb.vy*refreshRate;
			}
		}
	}
}

function drawDotTable(dotTable,color,l,w) {
	//add a gradient
	if (dotTable[0]) {
		var start=dotTable[0];
		cxt.beginPath();
		cxt.lineWidth=w;
		cxt.globalAlpha=1;
		cxt.strokeStyle=color;
		//cxt.strokeStyle="#FF7F50";
		cxt.moveTo((start.xx-xo)*zoom,(start.yy-yo)*zoom);
		for (var i=1;i<l;i=i+3) {
			var c=dotTable[i];
			if (c) cxt.lineTo((c.xx-xo)*zoom,(c.yy-yo)*zoom); //should handle the starting issues.
		}
		cxt.stroke();

	}
}

function returnTrigo(ship,teta) {
	var u=Math.cos(teta);
	var v=Math.sin(teta);
	var vect=u*ship.vy-v*ship.vx
	if (vect>0) return true;
	else return false;
}

var marginEjection=20;
var ejectionDuration=20;
var planetEjection=null;
var startEjection=null;
var storedWeight=0;
var ejectWeight=-20;



function updatePosition(object, t,f,planetTab) {
	//updates the position of the object according to the current thrust, friction and planetTab
	var dead=false;
	if (object.orbiting) {
		var orbit=object.orbit;
		var center=planetTab[orbit.center];
		if (orbit.clockwise) {
			orbit.teta=orbit.teta+refreshRate*orbit.tetaSpeed;
			object.vx=orbit.radius*orbit.tetaSpeed*Math.cos(orbit.teta+Math.PI/2);
			object.vy=orbit.radius*orbit.tetaSpeed*Math.sin(orbit.teta+Math.PI/2);
		}
		else {
			orbit.teta=orbit.teta-refreshRate*speed*orbit.tetaSpeed;
			object.vx=orbit.radius*orbit.tetaSpeed*Math.sin(orbit.teta);
			object.vy=-orbit.radius*orbit.tetaSpeed*Math.cos(orbit.teta);
		}
		object.xx=center.xx+orbit.radius*Math.cos(orbit.teta);
		object.yy=center.yy+orbit.radius*Math.sin(orbit.teta);

	}
	else {
		var v=Math.sqrt(object.vx*object.vx+object.vy*object.vy);
		var ax=0;
		var ay=0;
		if (v>0) {
			var ax=t*object.vx/v-f*v*object.vx;
			var ay=t*object.vy/v-f*v*object.vy;
		}

		var tableLength=planetTab.length;
		for (var i=0;i<tableLength;i++) {
			var p=planetTab[i];
			var r=distance(object,p);
			if (r>p.radius) { //the object is not in contact with the planet (like the planet itself...)
				var quotien=Math.pow(r,power)*adjust
				/*//experiment to shift p's center
				var margin=50;
				var u=p.xx-object.xx;
				var v=p.yy-object.yy;
				var X=p.xx-v*(p.radius+margin)/r;
				var Y=p.yy+u*(p.radius+margin)/r;
				var R=distance(object,{xx:X,yy:Y});
				var Q=Math.pow(R,power)*adjust;
				cxt.fillRect((X-xo)*zoom,(Y-yo)*zoom,3,3);
				ax=ax+k*p.weight*2*(X-object.xx)/Q; //Math.pow(r,power)
				ay=ay+k*p.weight*2*(Y-object.yy)/Q;
				*/

				ax=ax+k*p.weight*(p.xx-object.xx)/(quotien); //Math.pow(r,power)
				ay=ay+k*p.weight*(p.yy-object.yy)/(quotien);
				//ax=ax+k*p.weight*(p.xx-object.xx)/(r*r*r*adjust);
				//ay=ay+k*p.weight*(p.yy-object.yy)/(r*r*r*adjust);
				//now we test wether an object should enter an orbit
				if (object.isShip && p.weight>0) {
					if (r<p.radius+marginOrbiting && (currentLevelIndex!=0 || p.levelIndex!=0)) {
						//object is in close orbit
						//friction=0; //experiment to replace auto orbit
						if (!object.currentlyTestingOrbit) {
							object.currentlyTestingOrbit=true;
							p.testingOrbit=true;
							object.timeEnterOrbit=Date.now();
							object.orbit.center=i;
							if (currentLevel.levelNumber==1 && !help3Done) {
								displayingHelp=true;
								helpIndex=3;
								help3Done=true;
								helpTimer=Date.now();

							}
						}
						else if (Date.now()-object.timeEnterOrbit>minTimeOrbit ) {
							//object is entering orbit
							sp=1;
							if (p.levelIndex==currentLevelIndex) {
								var teta=giveTeta(object.xx-p.xx,object.yy-p.yy);
								var trig=returnTrigo(object,teta);
								object.orbit.center=i;
								object.orbit.teta=teta;
								object.orbit.radius=r;
								object.orbit.tetaSpeed=Math.sqrt(k*p.weight*object.weight/(r*r*r));
								object.orbit.clockwise=trig;
								object.orbiting=true;
								if (p.mission && !p.missionAccomplished) {
									p.missionAccomplished=true;
									currentLevel.numberOfMissions++;
								}
								if (!help13Done) {
									displayingHelp=true;
									helpIndex=13;
									help13Done=true;
									helpTimer=Date.now();
								}

								object.currentlyTestingOrbit=false;
								planetTable[object.orbit.center].testingOrbit=false;
							}
							else {
								if (currentLevel.numberOfMissions==currentLevel.maxNumberOfMissions) {
								//You win this level
								//object.orbit.center=0; //the planet at the start of the level is now at index 0;
								currentLevelIndex=p.levelIndex;
								currentLevel=levelTable[currentLevelIndex];
								planetTable=currentLevel.planetTable;
								resetLevel(currentLevel);
								score++;
								localStorage.setItem( 'bestLevel', currentLevelIndex );//s
								//localStorage.setItem( 'bestLevel', currentLevelIndex );//s

								//Calculate the time to complete level?
								//Calculate the fuel used to complete level?
								}
								else {
									//trying to enter orbit but can't
									//resetLevel(currentLevel);
									//currentLevel.reset();
									p.testingOrbit=false;
								}
							}
						}
						//First solution to deal with bounces
						/*
						else if (r<p.radius+marginEjection) {
							planetEjection=p;
							startEjection=Date.now();
							storedWeight=p.weight;
							p.weight=-3*p.weight;
						}
						*/

					}
					else if (p==planetTab[object.orbit.center]) {
						object.currentlyTestingOrbit=false;
						planetTab[object.orbit.center].testingOrbit=false;
						//friction=0.001;

						//object.orbit.center.testingOrbit=false;
					}

				}
			}
			else if (object.isShip) {
				if (p.target && p.activeTarget) {
					//success. You just hit a target
					//You gain some fuel back
					for (var a=0;a<shipTable.length;a++) {
						var ship=shipTable[a];
						ship.fuel=ship.fuel+p.fuel; //assuming that everybody wins fuel back in multiplayer mode
						if (ship.fuel>currentLevel.fuelMax) ship.fuel=currentLevel.fuelMax;
					}
					p.activeTarget=false;
					//this target won't be used again until you die
				}
				else if (!p.target) {
					//you just hit a planet
					if (bounceOn && !p.hardSurface) {
						var justBounced=true;
						//object.lives--;
						var ux=(object.xx-p.xx)/r;
						var uy=(object.yy-p.yy)/r;
						var scal=ux*object.vx+uy*object.vy;
						var coeff=1.1;
						if (Math.sqrt(object.vx*object.vx+object.vy*object.vy)>0.5) coeff=1;

						object.vx=1.1*(object.vx-2*scal*ux);
						object.vy=1.1*(object.vy-2*scal*uy);
						object.timeEnterOrbit=Date.now();
						if (!p.inert) {
							//make planets react to a bounce
							p.vx=-p.vx;
							p.vy=-p.vy;
						}
						if (!help11Done) {
							displayingHelp=true;
							helpIndex=11;
							help11Done=true;
							helpTimer=Date.now();

						}


					}


					//you die.Level resets
					//in multiplayer mode, you might wait for all ships to die to reset.
					else {
						var timerHelp4=Date.now();
						sp=1;
						if (currentLevel.levelNumber==1 && !help2Done) {
							displayingHelp=true;
							helpIndex=2;
							help2Done=true;
							helpTimer=Date.now();

						}
						else {
							resetLevel(currentLevel);
							dead=true;
						}
					}
					//currentLevel.reset();
					//object.die();
				}
			}
		}

		if (!dead) {
			object.ax=ax;
			object.ay=ay;

			if (!justBounced) {
				object.vx=object.vx+refreshRate*object.ax;
				object.vy=object.vy+refreshRate*object.ay;
			}
			else {
				justBounced=false;
			}

			//speed=0.2/v;
			object.xx=object.xx+refreshRate*speed*object.vx;
			object.yy=object.yy+refreshRate*speed*object.vy;

		}

	}
}


function createFuel() {
	for (var i=0;i<levelTable.length;i++) {
		var b=levelTable[i].bonusTable;
		for (var j=0;j<b.length;j++) {
			b[j].fuel=averageFuel;
		}
	}
}


shipTable[0]=new spaceShip(0,0,"#1abc9c");
//shipTable[1]=new spaceShip(600,200,"#34495e");

levelTable[0]=new level();
currentLevel=levelTable[0];
planetTable=currentLevel.planetTable;
planetTable[0]=new planet(0,0,planetWeight*2,50,"#f1c40f",true,false);
planetTable[0].startLevel=true;
planetTable[0].levelIndex=0;


// orbit(center,teta,radius,tetaSpeed,clockwise)
shipTable[0].orbit=new orbit(0,0,100,0,true);
resetLevel(currentLevel);
//currentLevel.reset();


function giveTeta(x,y) {
	if (x>0) return Math.atan(y/x);
	else if (x<0) return Math.atan(y/x)+Math.PI;
	else if (x==0 && y>0) return Math.PI/2;
	else return Math.PI*3/2;
}

function displayGrid(squares) {
	var xup=Math.ceil(xo/squares)*squares;
	var yup=Math.ceil(yo/squares)*squares;
	var xNumberOfLines=Math.ceil(canvas.width/(squares*zoom));
	var yNumberOfLines=Math.ceil(canvas.height/(squares*zoom));
	cxt.strokeStyle="#bdc3c7";
	cxt.lineWidth=1;
	cxt.globalAlpha=1;

	for (var i=0;i<xNumberOfLines;i++) {
		//(planet.xx-xo)*zoom;
		cxt.moveTo((xup+i*squares-xo)*zoom,0);
		cxt.lineTo((xup+i*squares-xo)*zoom,canvas.height);
		cxt.stroke();
	}
	for (var i=0;i<yNumberOfLines;i++) {
		//(planet.xx-xo)*zoom;
		cxt.moveTo(0,(yup+i*squares-yo)*zoom);
		cxt.lineTo(canvas.width,(yup+i*squares-yo)*zoom);
		cxt.stroke();
	}
}


function displayStarBackground(squares) {
	var xup=Math.ceil(xo/squares)*squares;
	var yup=Math.ceil(yo/squares)*squares;
	var xNumberOfLines=Math.ceil(canvas.width/(squares*zoom));
	var yNumberOfLines=Math.ceil(canvas.height/(squares*zoom));
	cxt.fillStyle="#bdc3c7";
	cxt.lineWidth=1;
	cxt.globalAlpha=1;

	for (var i=0;i<xNumberOfLines;i++) {
		//(planet.xx-xo)*zoom;
		for (var j=0;j<yNumberOfLines;j++) {
			cxt.fillRect((xup+i*squares-xo)*zoom,(yup+j*squares-yo)*zoom,1,1);
		}
	}
}

var compassWidth=10;


function renderSideCompass(a,b,co) {
	//b is the ship. a is the planet outside of scope
	//handle left border first
	var d=distance(a,b);
	cxt.lineWidth=compassWidth;
	cxt.strokeStyle=co;
	var re=false;
	if (b.orbiting) b=planetTable[b.orbit.center];
	if (d>0) {
		if ((a.xx-xo)*zoom<0 && (b.xx-xo)*zoom>0) {
			var k=(xo-a.xx)/(b.xx-a.xx);
			var yt=a.yy+(b.yy-a.yy)*k;
			var l=(1-k)*a.radius;
			//var l=ratioCompass/Math.sqrt(d);
			cxt.moveTo(compassWidth,(yt-l-yo)*zoom);
			cxt.lineTo(compassWidth,(yt+l-yo)*zoom);
			cxt.stroke();
			re=true;
		}
		//right border
		if ((a.xx-xo)*zoom>canvas.width && (b.xx-xo)*zoom<canvas.width) {
			var k=(xo+canvas.width/zoom-a.xx)/(b.xx-a.xx);
			var yt=a.yy+(b.yy-a.yy)*k
			var d=distance(a,b);
			var l=(1-k)*a.radius;
			cxt.moveTo(canvas.width-compassWidth,(yt-l-yo)*zoom);
			cxt.lineTo(canvas.width-compassWidth,(yt+l-yo)*zoom);
			cxt.stroke();
			re=true;
		}
		if ((a.yy-yo)*zoom<0 && (b.yy-yo)*zoom>0) {
			var k=(yo-a.yy)/(b.yy-a.yy);
			var xt=a.xx+(b.xx-a.xx)*k;
			var d=distance(a,b);
			var l=(1-k)*a.radius;
			cxt.moveTo((xt-l-xo)*zoom,compassWidth);
			cxt.lineTo((xt+l-xo)*zoom,compassWidth);
			cxt.stroke();
			re=true;
		}
		if ((a.yy-yo)*zoom>canvas.height && (b.yy-yo)*zoom<canvas.height) {
			var k=(yo+canvas.height/zoom-a.yy)/(b.yy-a.yy);
			var xt=a.xx+(b.xx-a.xx)*k;
			var d=distance(a,b);
			var l=(1-k)*a.radius;
			cxt.lineWidth=compassWidth;
			cxt.moveTo((xt-l-xo)*zoom,canvas.height-compassWidth);
			cxt.lineTo((xt+l-xo)*zoom,canvas.height-compassWidth);
			cxt.stroke();
			re=true;
		}
	}
	return re;
}
/*
if (currentLevel.levelNumber==1 && !help1Done) {
	displayingHelp=true;
	helpIndex=1;
	help1Done=true;
}
*/

var displayingHelp=false;
var helpTimer;
var helpIndex=0;
var help1Done=false;
var help2Done=false;
var help3Done=false;
var help4Done=false;
var help5Done=false;
var help6Done=false;
var help7Done=false;
var help8Done=false;
var help9Done=false;
var help10Done=false;
var help11Done=false;
var help13Done=false;
var help6Counter;
var timerHelp4=Date.now();

function render() {

	cxt.clearRect ( 0, 0 , canvas.width , canvas.height );//clear the canvas.

	cxt.fillStyle="#34495e";
	cxt.fillRect(0,0,canvas.width,canvas.height);
	cxt.font="20px Georgia";
	cxt.textAlign="left";
	cxt.fillStyle="#ecf0f1";
	//cxt.fillText("score: "+score,10,10);
	cxt.fillText("fuel: "+shipTable[0].fuel,10,30);
	//cxt.fillText("lives: "+shipTable[0].lives,10,50);
	cxt.fillText("processor: "+processEfficiency,10,70);
	//cxt.fillText("speeding: "+sp,10,50);
	//cxt.fillRect(processEfficiency*canvas.width/100,10,10,10);
	//cxt.fillText(processEfficiency,10,50);


	if (displayingStartLevel && currentlyPlaying) {
		cxt.fillStyle="#ecf0f1";
		cxt.font="80px Georgia";
		cxt.textAlign="center";
		cxt.fillText("Starting Level : "+levelTable[currentLevelIndex].levelNumber,canvas.width/2,canvas.height/2);
	}

	else {
		if (displayingHelp) {
				//list the help cases
				cxt.fillStyle="#ecf0f1";
				cxt.font="20px Georgia";//cxt.measureText(text).width;
				cxt.textAlign="center";
				switch(helpIndex) {
				    case 1:
						cxt.fillText("You control a spaceship",canvas.width/2,100);
						cxt.fillText("Every tap will power the thrusters for a short while",canvas.width/2,130);
				        break;
				    case 2:
						cxt.fillText("Don’t let yourself fall on the surface",canvas.width/2,100);
						cxt.fillText("Make short, frequent taps to stay in orbit",canvas.width/2,130);
				        break;
				    case 3:
						cxt.fillText("Stay 3s in the dark circle without crashing",canvas.width/2,100);
						cxt.fillText("to enter low orbit and win the level",canvas.width/2,130);
				        break;
				    case 4:
						cxt.fillText("To complete every level, get into",canvas.width/2,100);
						cxt.fillText("a low orbit around the yellow planet",canvas.width/2,130);
				        break;
				    case 5:
						cxt.fillText("You just ran out of fuel.",canvas.width/2,100);
						cxt.fillText("Next time let gravity do most of the work.",canvas.width/2,130);
				        break;
				    case 6:
						cxt.fillText("You're getting far: stop burning fuel and",canvas.width/2,100);
						cxt.fillText("wait for gravity to pull you back. It might take a while",canvas.width/2,130);
				        break;
				    case 7:
						cxt.fillText("If you don’t want to wait, simply burn all of your fuel. ",canvas.width/2,100);
						cxt.fillText("It will let you restart the level.",canvas.width/2,130);
				        break;
				    case 8:
						cxt.fillText("Your mission: enter low orbit around every colored planet ",canvas.width/2,100);
						cxt.fillText("Then the yellow target planet will appear",canvas.width/2,130);
				        break;
				    case 9:
						cxt.fillText("The purple circles are fuel fields",canvas.width/2,100);
						cxt.fillText("Go accross them while not in low orbit to refuel",canvas.width/2,130);
				        break;
				    case 10:
						cxt.fillText("Ever hitched an interplanetary ride?",canvas.width/2,100);
						cxt.fillText("Orbit around a grey planet to get to the end",canvas.width/2,130);
				        break;
				    case 11:
						cxt.fillText("Some planets have a rubber ring around them",canvas.width/2,100);
						cxt.fillText("You can bounce on them without damaging the ship",canvas.width/2,130);
				        break;
				    case 12:
						cxt.fillText("There has been some changes",canvas.width/2,100);
						cxt.fillText("1-Thrust is not continuous anymore. Tap for each burst",canvas.width/2,130);
						cxt.fillText("2-You can bounce on planets with rubber rings",canvas.width/2,160);
				        break;
				    case 13:
						cxt.fillText("Once you've entered low-orbit, your ship is in",canvas.width/2,100);
						cxt.fillText("autopilot. No need to thrust to keep circling",canvas.width/2,130);
				        break;

				}
		}
		if (!currentlyPlaying) {
			displayGrid(gridSize);

			for (var k=0;k<levelTable.length;k++) {
				var tab=levelTable[k].planetTable;
				var tar=levelTable[k].targetLevelTable;
				//display the planets in non active levels while not playing

				if (k!=currentLevelIndex) {
					for (i=0;i<tab.length;i++) {
						p=tab[i];
						if (i==0) drawPlanet(p,true);
						else drawPlanet(p,false);
					}
				}
				//display the connection between levels
				cxt.lineWidth=1;
				cxt.strokeStyle=colorStartLevel;
				for (var j=0;j<tar.length;j++) {
					var nextStart=levelTable[tar[j]].planetTable[0];
					cxt.moveTo((tab[0].xx-xo)*zoom,(tab[0].yy-yo)*zoom);
					cxt.lineTo((nextStart.xx-xo)*zoom,(nextStart.yy-yo)*zoom);
					cxt.stroke();
				}
			}
		}
		else {
			displayStarBackground(starGridSize);
		}


		for (var i=0;i<planetTable.length;i++) {
			var p=planetTable[i];
			drawPlanet(p,true);
		}

		var ta=currentLevel.targetLevelTable;
		for (var i=0;i<ta.length;i++) {
			//Only draw the next level if all missions are accomplished.
			if (currentLevel.numberOfMissions==currentLevel.maxNumberOfMissions) drawPlanet(levelTable[ta[i]].planetTable[0],true);
			else drawPlanet(levelTable[ta[i]].planetTable[0],false);
		}

		var bonusTable=currentLevel.bonusTable;
		for (var i=0;i<bonusTable.length;i++) {
			var p=bonusTable[i];
			if (p.activeTarget) drawPlanet(p,true);
		}
		for (var i=0;i<shipTable.length;i++) {
			shipTable[i].draw();
		}
	}

}


addEventListener('touchstart', startTouch, true);
addEventListener('touchend', touchEnd, true);

addEventListener("keydown", startTouch, false);
addEventListener("keyup", touchEnd, false);

addEventListener('mousedown', mouseIsDown, true);
addEventListener('mouseup', mouseIsUp, true);
addEventListener('mousemove', mouseIsMoving, true);


function loadFromString(s) {
	levelTable=JSON.parse(s);
	if (localStorage.getItem( 'bestLevel' )) {
		currentLevelIndex=localStorage.getItem( 'bestLevel' );
		//currentLevelIndex=3;
	}
	//(localStorage.getItem( 'bestLevel' )) currentLevelIndex=localStorage.getItem( 'bestLevel' );
	else currentLevelIndex=0;
	currentLevel=levelTable[currentLevelIndex];
	resetLevel(currentLevel);
}

var aKeyIsDown=false;
var timeStartTouch=Date.now();


function startTouch(event) {
	if (!aKeyIsDown) {
		aKeyIsDown=true;
		timeStartTouch=Date.now();
		event.preventDefault();
		var x=event.layerX;
		var y=event.layerY;

		if (event.keyCode) {
			keysDown[event.keyCode] = true;
			if (187 in keysDown) zoom=zoom*1.1; //+
			else if (189 in keysDown) zoom=zoom*0.9; //-
			else if (80 in keysDown) {
				currentlyPlaying=!currentlyPlaying; //p
				resetLevel(currentLevel);
			}
			else if (83 in keysDown) {
				//s key press. Want to store current map
				console.log(JSON.stringify(levelTable));
				localStorage.setItem( 'levelTable', JSON.stringify(levelTable) );//s
			}
			else if (82 in keysDown) {
				//r key pressed. Reload the
				loadFromString(localStorage.getItem( 'levelTable' ));
				//levelTable=JSON.parse( localStorage.getItem( 'storageTable' ) );
				//currentLevelIndex=0;
				//currentLevel=levelTable[0];
				resetLevel(currentLevel);
				//currentLevel.reset();
			}
			//else if (83 in keysDown) console.log(JSON.stringify(planetTable));
		}

		if (event.changedTouches) {
			var latestTouch=event.changedTouches[0];
			var x=latestTouch.pageX;
			var y=latestTouch.pageY;
			//e.preventDefault();
		}
		var i=0;
		if (false && x>canvas.width/2) i=1;
		var ship=shipTable[i];
		if (!displayingStartLevel) {
			ship.thrustOn=true;
		}
		if (displayingHelp && (ship.orbiting || ship.currentlyTestingOrbit)) {
			ship.timeEnterOrbit=Date.now();
		}
		if (ship.orbiting && Date.now()-ship.timeEnterOrbit>3000 && !displayingStartLevel && !displayingHelp) {
			ship.orbiting=false;
		}
		if (Date.now()-helpTimer>1000) {
			if (displayingHelp && (helpIndex==2 || helpIndex==5)) {
				resetLevel(currentLevel);
				dead=true;
			}
			if (displayingHelp && helpIndex==3) {
				shipTable[0].timeEnterOrbit=Date.now();
			}
			if (displayingHelp && helpIndex==6) {
				help6Counter=Date.now();
			}

			if (displayingHelp || displayingStartLevel) timerHelp4=Date.now();
			displayingHelp=false;
		}
		if (Date.now()-startLevelTimer>1000) {
			displayingStartLevel=false;
			if (currentLevel.levelNumber==3 && !help8Done) {
				displayingHelp=true;
				helpIndex=8;
				help8Done=true;
				helpTimer=Date.now();
			}
			if (currentLevel.levelNumber==7 && !help9Done) {
				displayingHelp=true;
				helpIndex=9;
				help9Done=true;
				helpTimer=Date.now();
			}
			if (currentLevel.levelNumber==8 && !help10Done) {
				displayingHelp=true;
				helpIndex=10;
				help10Done=true;
				helpTimer=Date.now();
			}
		}

		/*
		if (!currentlyPlaying && !(80 in keysDown)) {
			//score=0;
			//currentlyPlaying=true;
			//initShip1();
			//ship.orbiting=true;
			//ship.orbit=new orbit(sun,3*Math.PI/2,100,0,true);
		}
		*/
	}
}


var startTouchX=0;
var startTouchY=0;
var lastTouchX;
var lastTouchY;
var startxo=xo;
var startyo=xo;
var planetTouched=null;
var levelTouched=0;
var startPlanetx;
var startPlanety;
var planetTarget=null;
var initialRadius=0;
var mouseDown=false;


function removePlanet(i,l) {
	if (i==0) {
		//this planet is the start of a level. We remove this level entirely
		deleteLevel(l);
	}
	else if (i > -1) {
		//remove this planet from the corresponding level;
		var lev=levelTable[l];
		var pla=lev.planetTable;
		if (pla[i].mission) lev.maxNumberOfMissions--;
	    lev.planetTable.splice(i, 1);
		//update the orbit index
		for (var j=0;j<pla.length;j++) {
			var orbitIndex=-1;
			if (pla[j].orbiting) orbitIndex=pla[j].orbit.center;
			if (orbitIndex==i) {
				pla[j].orbiting=false;
				pla[j].inert=true;
			}
			if (orbitIndex>i) {
				pla[j].orbit.center--;
			}

		}
	}
}

function mouseIsDown(e) {
	//is the mouse on a planet?
	var x=e.layerX;
	var y=e.layerY;


	if (e.changedTouches) {
		//stay compatible with mobile
		var latestTouch=e.changedTouches[0];
		var x=latestTouch.pageX;
		var y=latestTouch.pageY;
		//e.preventDefault();

	}
	if (!mouseDown) {
		startTouchX=x;
		startTouchY=y;
		lastTouchX=x;
		lastTouchY=y;
		startxo=xo;
		startyo=yo;
	}
	var lev;
	var planetTab;
	mouseDown=true;
	for (var l=0;l<levelTable.length;l++) {
		lev=levelTable[l];
		planetTab=lev.planetTable;

		for (var i=0;i<lev.bonusTable.length;i++) {
			var p=lev.bonusTable[i];
			var r=distance({xx:x/zoom+xo,yy:y/zoom+yo},p);
			if (r<p.radius) {
				planetTouched=p;
				console.log(p);
				initialRadius=p.radius;
				if (69 in keysDown) lev.bonusTable.splice(i,1);
			}
		}

		for (var i=0;i<planetTab.length;i++) {
			var p=planetTab[i];
			var r=distance({xx:x/zoom+xo,yy:y/zoom+yo},p);
			if (r<p.radius) {
				levelTouched=l;
				planetTouched=p;
				console.log(p);
				startPlanetx=planetTouched.xx;
				startPlanety=planetTouched.yy;
				initialRadius=p.radius;
				if (77 in keysDown) {
					//make this current planet a mission when click with m
					if (p.mission) {
						p.mission=false;
						lev.maxNumberOfMissions--;
					}
					else {
						p.mission=true;
						lev.maxNumberOfMissions++;
					}
				}
				if (72 in keysDown) {
					//Change the surface of the planet when you click with h
					p.hardSurface=!p.hardSurface;
				}
				if (69 in keysDown) {
					//remove the planet when you click with e. Be careful about orbit center index.
					removePlanet(i,l);

				}
				if (76 in keysDown) {
					//this level becomes the current level
					currentLevelIndex=l;
					currentLevel=levelTable[l];
					planetTable=currentLevel.planetTable;
					resetLevel(currentLevel);
					//currentLevel.reset();
				}

			}
		}
	}
	if (planetTouched==null) {
		//not touching a planet
		if (66 in keysDown) {
			//build a new planet to the current level when you click with b
			var col=colorArray[Math.floor(Math.random()*colorArray.length)];
			var pla=new planet(x/zoom+xo,y/zoom+yo,planetWeight,planetRadius,col,true,false);
			pla.levelIndex=currentLevelIndex;
			planetTable[planetTable.length]=pla;
			radiusInitial=pla.radius;
			pla.mission=false;
			resetLevel(currentLevel);
		}
		else if (76 in keysDown) {
			//build a new level that starts with this new planet when you click with l
			currentLevelIndex=levelTable.length;
			levelTable[currentLevelIndex]=new level();
			currentLevel=levelTable[currentLevelIndex]
			planetTable=currentLevel.planetTable;
			planetTable[0]=new planet(x/zoom+xo,y/zoom+yo,planetWeight,startLevelRadius,colorStartLevel,true,false);
			var pla=planetTable[0];
			pla.levelIndex=currentLevelIndex;
			radiusInitial=pla.radius;//?
			pla.startLevel=true;
			resetLevel(currentLevel);
			//currentLevel.reset();
		}
		else if (70 in keysDown) {
			//build a new bonus
			var pla=new planet(x/zoom+xo,y/zoom+yo,0,30,colorBonus,true,true);
			pla.activeTarget=true;
			pla.levelIndex=currentLevelIndex;
			currentLevel.bonusTable[currentLevel.bonusTable.length]=pla;
			radiusInitial=pla.radius;
			pla.mission=false;
			resetLevel(currentLevel);
		}

	}

}

function mouseIsUp(e) {
	startTouchX=0;
	startTouchY=0;
	startxo=xo;
	startyo=yo;
	initialRadius=0;
	planetTouched=null;
	planetTarget=null;
	mouseDown=false;
	planetTargetTouched=false;
}

var planetTargetTouched=false;

function mouseIsMoving(e) {
	var x=e.layerX;
	var y=e.layerY;
	if (mouseDown && !planetTargetTouched) {
		if (e.changedTouches) {
			//stay compatible with mobile
			var latestTouch=e.changedTouches[0];
			var x=latestTouch.pageX;
			var y=latestTouch.pageY;
			//e.preventDefault();
		}
		if (planetTouched==null) {
			//moving the screen
			xo=startxo-(x-startTouchX)/zoom;
			yo=startyo-(y-startTouchY)/zoom;
		}
		else {
			//Check that the mouse is not touching a new planet
			if (81 in keysDown) {
				//if q pressed, move the planet
				//if (levelTable[levelTouched].planetTable.indexOf(planetTouched)>0) {
					if (planetTouched.startLevel) {
						//move the entire level
						var tableMoving=levelTable[levelTouched].planetTable;
						for (var i=0;i<tableMoving.length;i++) {
							var p=tableMoving[i];
							p.xx=p.xx+(x-lastTouchX)/zoom;
							p.yy=p.yy+(y-lastTouchY)/zoom;
						}
						tableMoving=levelTable[levelTouched].bonusTable;
						for (var i=0;i<tableMoving.length;i++) {
							var p=tableMoving[i];
							p.xx=p.xx+(x-lastTouchX)/zoom;
							p.yy=p.yy+(y-lastTouchY)/zoom;
						}
						lastTouchX=x;
						lastTouchY=y;
					}
					else {
						//move one planet
						planetTouched.xx=startPlanetx+(x-startTouchX)/zoom;
						planetTouched.yy=startPlanety+(y-startTouchY)/zoom;
						//if planet orbiting, update the orbit
						if (planetTouched.orbiting) planetTouched.orbit=new orbit(planetTouched.orbit.center,0,distance(planetTouched,levelTable[levelTouched].planetTable[planetTouched.orbit.center]),0,false);
					}
			}
			else {
				//else change the radius
				var iTarget=-1;
				for (var l=0;l<levelTable.length;l++) {
					lev=levelTable[l];
					planetTab=lev.planetTable;
					for (var i=0;i<planetTab.length;i++) {
						var p=planetTab[i];
						var r=distance({xx:x/zoom+xo,yy:y/zoom+yo},p);
						if (r<p.radius && p!=planetTouched) {
							planetTarget=p;
							iTarget=i;
						}
					}
				}

				if (planetTarget==null) {
					//change the radius of the planet
					planetTouched.radius=distance({xx:x/zoom+xo,yy:y/zoom+yo},planetTouched);

				}
				else {
					planetTargetTouched=true;
					//if planetTouched and target are both startLevel, create a connection between both
					if (planetTouched.startLevel && planetTarget.startLevel) {
						var lStart=planetTouched.levelIndex;
						var lEnd=planetTarget.levelIndex;
						var ar=levelTable[lStart].targetLevelTable;
						//check if the levels are already connected
						var ind=levelTable[lStart].targetLevelTable.indexOf(lEnd);
						//if not connect them
						if (ind==-1) ar[ar.length]=lEnd;
						//else disconnect them
						else levelTable[lStart].targetLevelTable.splice(ind, 1);

						planetTouched.radius=initialRadius;
					}
					else {
						//planet starts orbiting around target

						planetTouched.orbit=new orbit(iTarget,0,distance(planetTouched,planetTarget),0,false);
						planetTouched.inert=false;
						planetTouched.orbiting=true;
						//get back to the initial radius
						planetTouched.radius=initialRadius;
					}
				}
			}
		}
	}
}

function touchEnd(event) {
	event.preventDefault();
	var x=event.layerX;
	var y=event.layerY;

	if (event.keyCode) delete keysDown[event.keyCode];
	aKeyIsDown=false;

	if (event.changedTouches) {
		var latestTouch=event.changedTouches[0];
		var x=latestTouch.pageX;
		var y=latestTouch.pageY;
		//e.preventDefault();
	}
	var i=0;
	if (false && x>canvas.width/2) i=1;
	var ship=shipTable[i];
	ship.thrustOn=false;
}

function resetLevelNumber(level,k) {
	level.levelNumber=k;
	if (!level.targetLevelTable.length==0) resetLevelNumber(levelTable[level.targetLevelTable[0]],k+1);
}

function distance(a,b) {
	var k=a.xx-b.xx;
	var l=a.yy-b.yy;
	return Math.sqrt(k*k+l*l);
}

function cleanify() {
	//turn every number in the database into integers
	for (var i=0;i<levelTable.length;i++) {
		var t=levelTable[i].planetTable;
		for (var j=0;j<t.length;j++) {
			var p=t[j];
			p.xx=Math.floor(p.xx);
			p.yy=Math.floor(p.yy);
			p.radius=Math.floor(p.radius);
		}
	}
}

function changeOrbitSpeed(levelIndex,newSpeed) {
	var table=levelTable[levelIndex].planetTable;
	var l=table.length;
	for (var i=0;i<l;i++) {
		var p=table[i];
		if (p.orbiting) p.orbit.tetaSpeed=newSpeed;
	}
}

function changeLives() {
	var l=levelTable.length;
	for (var i=0;i<l;i++) {
		var t=levelTable[i];
		t.lives=3;
	}
}

function changeHardSurface() {
	var l=levelTable.length;
	for (var i=0;i<l;i++) {
		var t=levelTable[i].planetTable;
		for (var j=0;j<t.length;j++) {
			t[j].hardSurface=true;
		}
	}
}

var counter=0;

var xo=shipTable[0].xx*zoom-canvas.width/2;
var yo=shipTable[0].yy*zoom-canvas.height/2;

loadFromString('[{"planetTable":[{"xx":1002,"yy":-1,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":5,"radius":50,"levelIndex":0,"hardSurface":false}],"bonusTable":[],"targetLevelTable":[1],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":0,"levelNumber":1,"lives":3},{"planetTable":[{"xx":1003,"yy":-1,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":5,"radius":50,"levelIndex":1,"hardSurface":false}],"bonusTable":[],"targetLevelTable":[2],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":0,"levelNumber":2,"lives":3},{"planetTable":[{"xx":2001,"yy":1,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":5,"radius":50,"levelIndex":2,"hardSurface":false},{"xx":1728,"yy":501,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":true,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":2,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[3],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":1,"maxNumberOfMissions":1,"levelNumber":3,"lives":3},{"planetTable":[{"xx":1996,"yy":1005,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":3,"hardSurface":false},{"xx":2001,"yy":1480,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":3,"hardSurface":true},{"xx":2001,"yy":2000,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":42.01877565386167,"levelIndex":3,"hardSurface":false},{"xx":2001,"yy":2507,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":33.91871798931665,"levelIndex":3,"hardSurface":false}],"bonusTable":[],"targetLevelTable":[4],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":3,"levelNumber":4,"lives":3},{"planetTable":[{"xx":1998,"yy":2994,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":4,"hardSurface":false},{"xx":2427,"yy":3256,"vx":0.02616718514156134,"vy":-0.04287841440360466,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-24.584808280288627,"radius":502.3226055036743,"tetaSpeed":0.0001,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":4,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[5],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":1,"levelNumber":5,"lives":3},{"planetTable":[{"xx":990,"yy":3997,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":5,"hardSurface":false},{"xx":-48.765006348894076,"yy":4374.305080779733,"vx":0.015092203231189307,"vy":0.04155060025395577,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-3.489999999999681,"radius":1105.165988617647,"tetaSpeed":0.00004,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":55,"levelIndex":5,"hardSurface":false},{"xx":-465.9097891262857,"yy":4023.107181190039,"vx":-0.03511978995896941,"vy":0.041714478277739164,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":-8.725000000000604,"radius":545.2978401521597,"tetaSpeed":0.0001,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":37,"levelIndex":5,"hardSurface":false}],"bonusTable":[],"targetLevelTable":[10],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":1,"levelNumber":6,"lives":3},{"planetTable":[{"xx":3001,"yy":7008,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":6,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":0,"lives":3},{"planetTable":[{"xx":3001,"yy":-1991,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":7,"hardSurface":true},{"xx":2676,"yy":-2006,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3001,"yy":-2331,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3316,"yy":-2001,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3001,"yy":-1701,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2671,"yy":-1721,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2661,"yy":-2316,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3306,"yy":-2331,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3316,"yy":-1716,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2321,"yy":-1996,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2331,"yy":-1701,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2321,"yy":-1426,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2671,"yy":-1456,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3001,"yy":-1431,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3316,"yy":-1436,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3576,"yy":-1441,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3566,"yy":-1716,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3551,"yy":-1986,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3546,"yy":-2351,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3541,"yy":-2621,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#34495e","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":3286,"yy":-2651,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2981,"yy":-2656,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2656,"yy":-2661,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#34495e","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2281,"yy":-2661,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true},{"xx":2296,"yy":-2336,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":7,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":4,"lives":3},{"planetTable":[{"xx":5988,"yy":2009,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":8,"hardSurface":true},{"xx":6952,"yy":2308,"vx":0.029509052620763383,"vy":-0.09502484229420227,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-24.83164261253233,"radius":1010.049503737316,"tetaSpeed":0.00009851129100569993,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":8,"hardSurface":true},{"xx":4245,"yy":1028,"vx":-0.034691571879321544,"vy":0.06161570287306523,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-8.911984961352982,"radius":1999.9999999999973,"tetaSpeed":0.000035355339059327445,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":8,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":2,"lives":3},{"planetTable":[{"xx":5996,"yy":4003,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":9,"hardSurface":true},{"xx":5486,"yy":3464,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":6516,"yy":3449,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":6541,"yy":4528,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":5461,"yy":4493,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#34495e","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":4481,"yy":3444,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#2980b9","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":4471,"yy":4483,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":4486,"yy":5518,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":5501,"yy":5488,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true},{"xx":6521,"yy":5468,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":9,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":4,"lives":3},{"planetTable":[{"xx":-1003,"yy":5010,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":10,"hardSurface":true},{"xx":-3005,"yy":4001,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":10,"hardSurface":true},{"xx":-5006,"yy":3003,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":10,"hardSurface":false},{"xx":-4088.9493339806295,"yy":3708.9551588444037,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"hardSurface":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2ecc71","isShip":false,"weight":10,"radius":30,"levelIndex":10},{"xx":-6575.450321726346,"yy":3184.7738695358466,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"hardSurface":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":10},{"xx":-2476.0838284158417,"yy":4733.124754878045,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"hardSurface":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2980b9","isShip":false,"weight":10,"radius":30,"levelIndex":10}],"bonusTable":[{"xx":-2860.6946121377623,"yy":3680.547485335991,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":55.29140994994847,"levelIndex":10,"fuel":300},{"xx":-5286.295346599131,"yy":3365.162047049052,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":10,"fuel":500},{"xx":-965.8571428571428,"yy":4732.857142857143,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":82.7708910678339,"levelIndex":10},{"xx":-7811.980542659352,"yy":2859.512659246948,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"hardSurface":true,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":48.460577339509086,"levelIndex":10}],"targetLevelTable":[11],"fuelMax":2000,"fuelStart":200,"numberOfMissions":0,"maxNumberOfMissions":2,"levelNumber":7,"lives":3},{"planetTable":[{"xx":-8001,"yy":3014,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":11,"hardSurface":false},{"xx":-8001,"yy":6555,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-9484.949978669407,"yy":3947.7231714282684,"vx":0.1564366097143034,"vy":-0.08903699872016524,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":111.00910714419528,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-10893.93421877393,"yy":5760.687966950726,"vx":0.04765872198295549,"vy":-0.17357605312643604,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":110.2237089807959,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-10608.276828565982,"yy":8038.949978679508,"vx":-0.0890369987207713,"vy":-0.15643660971395845,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":109.43831081739651,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-8795.312033038066,"yy":9447.934218777007,"vx":-0.17357605312662067,"vy":-0.04765872198228301,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":108.65291265399713,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2980b9","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-6517.050021311058,"yy":9162.276828560613,"vx":-0.15643660971363627,"vy":0.08903699872133734,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":107.867514490598,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-5108.0657812208865,"yy":7349.312033030394,"vx":-0.047658721981822694,"vy":0.17357605312674707,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":107.08211632719959,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#2980b9","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-5393.723171441952,"yy":5071.050021306552,"vx":0.08903699872160774,"vy":0.15643660971348236,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":106.29671816380137,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true},{"xx":-7172.030779287326,"yy":3671.8055856201763,"vx":0.17299166486278966,"vy":0.049738153242759514,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":1,"teta":105.52332000040333,"radius":3000,"tetaSpeed":0.00006,"clockwise":true},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":11,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[12],"fuelMax":2000,"fuelStart":500,"numberOfMissions":0,"maxNumberOfMissions":0,"levelNumber":8,"lives":3},{"planetTable":[{"xx":-7999,"yy":9999,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":12,"hardSurface":true},{"xx":-7602,"yy":10897,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":12,"hardSurface":true},{"xx":-7230,"yy":10277,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":12,"hardSurface":true},{"xx":-6937,"yy":11385,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":30,"levelIndex":12,"hardSurface":true},{"xx":-6448,"yy":11831,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#3498db","isShip":false,"weight":10,"radius":32,"levelIndex":12,"hardSurface":true},{"xx":-6128,"yy":12412,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":12,"hardSurface":false},{"xx":-6536,"yy":10786,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":false,"color":"#d35400","isShip":false,"weight":10,"radius":30,"levelIndex":12,"hardSurface":false}],"bonusTable":[{"xx":-7083.716094906471,"yy":11489.14142712325,"vx":0.13552731879459104,"vy":0.192765815396344,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":3,"teta":-160.83400684464036,"radius":180.09479342557825,"tetaSpeed":0.0013084232834207844,"clockwise":false},"orbiting":true,"inert":false,"target":true,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":12,"fuel":500}],"targetLevelTable":[13],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":6,"levelNumber":9,"lives":3},{"planetTable":[{"xx":-5997,"yy":12999,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":13,"hardSurface":false},{"xx":-6450,"yy":12606,"vx":-0.03936961813364704,"vy":0.04527729196861057,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-33.841799999987494,"radius":600,"tetaSpeed":0.0001,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":true,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":13,"hardSurface":true},{"xx":-6902,"yy":12212,"vx":-0.07873923626729408,"vy":0.09055458393722114,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-33.841799999987494,"radius":1200,"tetaSpeed":0.0001,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":true,"color":"#e67e22","isShip":false,"weight":10,"radius":30,"levelIndex":13,"hardSurface":false},{"xx":-7355,"yy":11818,"vx":-0.11810885440094111,"vy":0.1358318759058317,"ax":0,"ay":0,"testingOrbit":false,"orbit":{"center":0,"teta":-33.841799999987494,"radius":1800,"tetaSpeed":0.0001,"clockwise":false},"orbiting":true,"inert":false,"target":false,"activeTarget":false,"startLevel":false,"mission":true,"missionAccomplished":true,"color":"#2980b9","isShip":false,"weight":10,"radius":30,"levelIndex":13,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[14],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":3,"maxNumberOfMissions":3,"levelNumber":10,"lives":3},{"planetTable":[{"xx":-4003,"yy":13003,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":14,"hardSurface":true},{"xx":-3520,"yy":12185,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#1abc9c","isShip":false,"weight":10,"radius":30,"levelIndex":14,"hardSurface":true},{"xx":-2501,"yy":12515,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#e74c3c","isShip":false,"weight":10,"radius":30,"levelIndex":14,"hardSurface":true},{"xx":-1577,"yy":12067,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#34495e","isShip":false,"weight":10,"radius":30,"levelIndex":14,"hardSurface":true}],"bonusTable":[{"xx":-3707.5414943536684,"yy":12588.150353865434,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":62.66299451537634,"levelIndex":14},{"xx":-3796.3440172775054,"yy":12257.159132058408,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":65.08625713737845,"levelIndex":14},{"xx":-3727.7238859272675,"yy":11950.3867801397,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":14},{"xx":-3517.827013561836,"yy":11918.094953621941,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":14},{"xx":-3307.930141196404,"yy":12051.298738007696,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":14},{"xx":-3174.726356810649,"yy":12313.669828464486,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":46.02293378389112,"levelIndex":14},{"xx":-2964.829484445217,"yy":12563.931483977116,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":68.62013135023699,"levelIndex":14},{"xx":-2706.494872303147,"yy":12697.13526836287,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":48.60563539194325,"levelIndex":14},{"xx":-2391.6495637549997,"yy":12697.13526836287,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":43.47420193038235,"levelIndex":14},{"xx":-2121.2055166687696,"yy":12430.727699591362,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":42.14207082224541,"levelIndex":14},{"xx":-2016.2570804860534,"yy":12059.371694637135,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":70.6095326331524,"levelIndex":14},{"xx":-1806.3602081206218,"yy":11869.657213845303,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":52.62923827574006,"levelIndex":14},{"xx":-1568.2079875521504,"yy":11833.328909012824,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":43.47420193038041,"levelIndex":14},{"xx":-1386.5664633897577,"yy":11922.131431936661,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":46.02293378389048,"levelIndex":14},{"xx":-1112.0859379888088,"yy":12140.101260931533,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":51.6921442617101,"levelIndex":14},{"xx":-853.7513258467384,"yy":12442.83713453552,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":64.70967003931656,"levelIndex":14},{"xx":-748.8028896640226,"yy":12826.302574433907,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":53.85333767712214,"levelIndex":14},{"xx":-849.7148475320191,"yy":13080.600708261256,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":true,"fuel":1000,"activeTarget":true,"startLevel":false,"mission":false,"missionAccomplished":false,"color":"#9b59b6","isShip":false,"weight":0,"radius":30,"levelIndex":14}],"targetLevelTable":[15],"fuelMax":100,"fuelStart":100,"numberOfMissions":0,"maxNumberOfMissions":0,"levelNumber":11,"lives":3},{"planetTable":[{"xx":-1000,"yy":12999,"vx":0,"vy":0,"ax":0,"ay":0,"testingOrbit":false,"orbit":null,"orbiting":false,"inert":true,"target":false,"fuel":1000,"activeTarget":false,"startLevel":true,"mission":false,"missionAccomplished":false,"color":"#f1c40f","isShip":false,"weight":10,"radius":50,"levelIndex":15,"hardSurface":true}],"bonusTable":[],"targetLevelTable":[],"fuelMax":2000,"fuelStart":1000,"numberOfMissions":0,"maxNumberOfMissions":0,"lives":3}]');


resetLevelNumber(levelTable[0],1);
//cleanify(); //created cleanify to make every number into integers
//createFuel();

//changeOrbitSpeed(11,0.00006);
changeLives();
//changeHardSurface();

var processCounter=0;
var processCounterMax=100;
var processEfficiency=100;
var lastProcessCountDate=Date.now();

var main = function () {
	counter++; //in case you don't want to render for every main loop
	processCounter++;
	var now=Date.now();
	if (processCounter==processCounterMax) {
		var n=Date.now();
		processCounter=0;
		processEfficiency=Math.floor(100*processCounterMax*refreshRate/(n-lastProcessCountDate));
		lastProcessCountDate=n;
		speedAdjust=0.5*100/processEfficiency;
	}
	//currentLevel=levelTable[currentLevelIndex];
	//planetTable=currentLevel.planetTable;

	if (currentlyPlaying && !displayingHelp && !displayingStartLevel) {
		var tableLength=planetTable.length
		for (var i=0;i<tableLength;i++) {
			var p=planetTable[i];
			if (!p.inert) updatePosition(p,0,0,planetTable);
		}
		var bonusTable=currentLevel.bonusTable;
		tableLength=bonusTable.length
		for (i=0;i<tableLength;i++) {
			var p=bonusTable[i];
			if (!p.inert) updatePosition(p,0,0,planetTable);
		}
		tableLength=shipTable.length
		var h=0.005;
		for (var i=0;i<tableLength;i++) {
			var t=0;
			var ship=shipTable[i];
			var w=true;
			if (tapsOn && !(Date.now()-timeStartTouch<100))  w=false;
			if (aKeyIsDown && w) {
				sp=1;
				ship.thrustOn=true;
				t=ship.thrust;
				ship.fuel=ship.fuel-fuelConsumption*refreshRate;
				if (ship.fuel<0) {
					ship.fuel=0;
					ship.thrustOn=false;
					//you die
					sp=1;
					if (!help5Done) {
						displayingHelp=true;
						helpIndex=5;
						help5Done=true;
						helpTimer=Date.now();
					}
					else {
						resetLevel(currentLevel);
						dead=true;
					}

				}
			}
			else if (aKeyIsDown) {
				//if (speed<4) speed=speed*1.01;
				//if (speedAdjust<10) speedAdjust=speedAdjust*1.01;
				if (sp<speedOn) sp=sp*(1+h);
				ship.thrustOn=false;
			}
			if (!aKeyIsDown) {
				//speed=1;
				//speedAdjust=1;

				if (sp>1) sp=sp*(1-2*h);
				else sp=1;
				speed=1;
				ship.thrustOn=false;
			}
			speed=1;
			counterSp=sp;
			while (counterSp>=1) {
				counterSp--;
				updatePosition(ship,t,friction,objectTable);
			}
			if (counterSp>0 && counterSp<1) {
				speed=counterSp;
				counterSp=0;
				updatePosition(ship,t,friction,objectTable);
			}
			//updatePosition(ship,t,friction,objectTable);
			if (ship.orbiting) updateDotTable(ship.dotTable,ship.orbit);
			addDot(ship);
			//next paragraph is here to deal with the floating camera.
			//If multiple ships are causing the camera to move we should zoom out
			if (i==0) {
				var xx=ship.xx;
				var yy=ship.yy;
				if (ship.orbiting) {
					var pla=planetTable[ship.orbit.center];
					xx=pla.xx;
					yy=pla.yy;
				}
				var m=(xx-xo)*zoom-marginWidth;
				if (m<0) xo=xo+cameraSpeed*m;
				else {
					m=((xo-xx)*zoom+canvas.width-marginWidth);
					if (m<0)  xo=xo-cameraSpeed*m;
				}
				m=(yy-yo)*zoom-marginHeight;
				if (m<0) yo=yo+cameraSpeed*m;
				else {
					m=((yo-yy)*zoom+canvas.height-marginHeight);
					if (m<0)  yo=yo-cameraSpeed*m;
				}
			}
		}
		/*
		if (planetEjection && now-startEjection>ejectionDuration) {
			planetEjection.weight=storedWeight;
			planetEjection=null;
		}
		*/
		//put the help tests
		if (currentLevel.levelNumber==1 && !help1Done) {
			displayingHelp=true;
			helpIndex=1;
			help1Done=true;
			helpTimer=Date.now();
		}

		if (currentLevel.levelNumber==1 && !help4Done && now-timerHelp4>5000) {
			displayingHelp=true;
			helpIndex=4;
			help4Done=true;
			helpTimer=Date.now();

		}
		var d=distance(shipTable[0],planetTable[0]);
		if (!help6Done && ((d>1000 && currentLevelIndex==0) || (d>3000 && currentLevelIndex>0 && currentLevelIndex<5))) {
			displayingHelp=true;
			helpIndex=6;
			help6Done=true;
			helpTimer=Date.now();

		}
		if (!help7Done && help6Done && now-help6Counter>5000) {
			displayingHelp=true;
			helpIndex=7;
			help7Done=true;
			helpTimer=Date.now();

		}
		if (!localStorage.getItem( 'rulesUpdate' )) {
			displayingHelp=true;
			helpIndex=12;
			localStorage.setItem( 'rulesUpdate', JSON.stringify(true) );//s
			helpTimer=Date.now();

		}

	}

	if (counter==1) {
		render();
		counter=0;
	}
};

setInterval(main, refreshRate); //run the main function every refreshRate
