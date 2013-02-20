(function() {
    const CANVAS        = document.getElementById('game'),
          CONTEXT       = CANVAS.getContext('2d'),
          WIDTH         = 18,
          HEIGHT        = 14,
          AREA_WIDTH    = 16,
          AREA_HEIGHT   = 10,
          UNIT          = 32,
          FPS           = 12,
          IMG           = new Image();

    var lastRun 	    = 0,
        repeatRate      = 1000 / FPS,
        repeatRateTimer = null,
        level           = null,
        controlsEnabled = true,
        shiftPressed    = false,
        entities        = [],
        collidable      = [],
        movable         = [],
        collectable     = [],
        enterable       = [],
        shootable       = [],
        playerMoveFrame = 0,
        playerMoveTimer = 0,
        playerCollision = false,
        entityAnimFrame = 0,
        entityAnimTimer = 0,
        inventory       = {screw: 0, key: 0, ammo: 0};

    var levels = [
        {
            bgColor: '#169212',
            entities: {
                player: [
                //    {x: 3, y: 3, d: 'down', p: true} // d = direction, p = player
                    {x: 3, y: 3, d: 'down', p: true}
                ],
                wall: [
                    {x: 1, y: 1},
                    {x: 2, y: 1},
                    {x: 3, y: 1},
                    {x: 4, y: 1},
                    {x: 5, y: 1},
                    {x: 6, y: 1},
                    {x: 7, y: 1},
                    {x: 8, y: 1},
                    {x: 9, y: 1},
                    {x: 10, y: 1},
                    {x: 11, y: 1},
                    {x: 12, y: 1},
                    {x: 13, y: 1},
                    {x: 14, y: 1},
                    {x: 15, y: 1},
                    {x: 16, y: 1},
                    {x: 1, y: 2},
                    {x: 5, y: 2},
                    {x: 9, y: 2},
                    {x: 12, y: 2},
                    {x: 16, y: 2},
                    {x: 1, y: 3},
                    {x: 5, y: 3},
                    {x: 9, y: 3},
                    {x: 10, y: 3},
                    {x: 12, y: 3},
                    {x: 16, y: 3},
                    {x: 1, y: 4},
                    {x: 3, y: 4},
                    {x: 5, y: 4},
                    {x: 10, y: 4},
                    {x: 12, y: 4},
                    {x: 16, y: 4},
                    {x: 1, y: 5},
                    {x: 5, y: 5},
                    {x: 6, y: 5},
                    {x: 12, y: 5},
                    {x: 14, y: 5},
                    {x: 16, y: 5},
                    {x: 1, y: 6},
                    {x: 6, y: 6},
                    {x: 8, y: 6},
                    {x: 9, y: 6},
                    {x: 10, y: 6},
                    {x: 11, y: 6},
                    {x: 12, y: 6},
                    {x: 14, y: 6},
                    {x: 16, y: 6},
                    {x: 1, y: 7},
                    {x: 6, y: 7},
                    {x: 9, y: 7},
                    {x: 14, y: 7},
                    {x: 16, y: 7},
                    {x: 1, y: 8},
                    {x: 2, y: 8},
                    {x: 3, y: 8},
                    {x: 4, y: 8},
                    {x: 6, y: 8},
                    {x: 9, y: 8},
                    {x: 14, y: 8},
                    {x: 16, y: 8},
                    {x: 1, y: 9},
                    {x: 6, y: 9},
                    {x: 7, y: 9},
                    {x: 9, y: 9},
                    {x: 14, y: 9},
                    {x: 16, y: 9},
                    {x: 1, y: 10},
                    {x: 6, y: 10},
                    {x: 9, y: 10},
                    {x: 11, y: 10},
                    {x: 12, y: 10},
                    {x: 13, y: 10},
                    {x: 14, y: 10},
                    {x: 16, y: 10}
                ],
                rubble: [
                    {x: 12, y: 7},
                    {x: 12, y: 8},
                    {x: 12, y: 9}
                ],
                ammo: [
                    {x: 2, y: 7}
                ],
                screw: [
                    {x: 10, y: 2},
                    {x: 7, y: 8}
                ],
                key: [
//                    {x: 4, y: 2},
//                    {x: 4, y: 3}
                ],
                bomb: [
                    {x: 2, y: 9}
                ],
                crate: [
                    {x: 3, y: 5},
                    {x: 8, y: 5},
                    {x: 8, y: 8}
                ],
                teleport: [
                    {x: 7, y: 3, i: 1, t: 2}, // i = identifier, t = target
                    {x: 14, y: 3, i: 2, t: 1}
                ],
                door: [
//                    {x: 4, y: 4, o: true},
//                    {x: 5, y: 8, o: true}
                ]
            }
        }
    ];

    window.requestAnimFrame = (function() {
        return (window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback, element) {
                window.setTimeout(function() {
                    callback(+new Date);
                }, repeatRate);
            });
    })();

    function inArray(needle, haystack) {
        for (var key in haystack) {
            if (haystack[key]['x'] === needle.x && haystack[key]['y'] === needle.y) {
                return haystack[key];
            }
        }

        return false;
    }

    function setLevel(lvl) {
        level = levels[lvl - 1];
        entities = level.entities;
        entities.smokeStart = [];
        entities.smokeEnd = [];
        entities.shotX = [];
        entities.shotY = [];

        for (var entity in entities) {
            for (var i = 0; i < entities[entity].length; i++) {
                switch (entity) {
                    case 'wall':
                    case 'rubble':
                    case 'door':
                        collidable[collidable.length] = entities[entity][i];
                        break;

                    case 'crate':
                        movable[movable.length] = entities[entity][i];
                        break;

                    case 'bomb':
                        shootable[shootable.length] = entities[entity][i];
                        movable[movable.length] = entities[entity][i];
                        break;

                    case 'screw':
                    case 'key':
                        collectable[collectable.length] = entities[entity][i];
                        break;

                    case 'ammo':
                        shootable[shootable.length] = entities[entity][i];
                        collectable[collectable.length] = entities[entity][i];
                        break;

                    case 'teleport':
                        enterable[enterable.length] = entities[entity][i];
                        break;
                }
            }
        }
    }

    function setPlayerDirection(direction) {
        entities.player[0].d = direction;

        if (!playerCollision) {
            playerMoveTimer = 1;
        }
    }

    function drawHUD() {}

    function drawArea() {
		CONTEXT.fillStyle = level.bgColor;
		CONTEXT.fillRect(UNIT, UNIT, AREA_WIDTH * UNIT, AREA_HEIGHT * UNIT);

        for (var entity in entities) {
            for (var i = 0; i < entities[entity].length; i++) {
                drawEntity(entities[entity][i], entity);
            }
        }
	}

	function drawEntity(entity, type) {
        var offset = {},
            interaction = null;

        switch (type) {
            case 'player':
                switch (entity.d) {
                    case 'up':
                        offset.x = 1;
                        offset.y = 2;
                        break;

                    case 'down':
                        offset.x = 1;
                        offset.y = 1;
                        break;

                    case 'left':
                        offset.x = 1;
                        offset.y = 3;
                        break;

                    case 'right':
                        offset.x = 1;
                        offset.y = 4;
                        break;
                }

                break;

            case 'wall':
                offset.x = 3;
                offset.y = 1;
                break;

            case 'rubble':
                offset.x = 2;
                offset.y = 11;
                break;

            case 'ammo':
                offset.x = 1;
                offset.y = 5;
                break;

            case 'screw':
                offset.x = 2;
                offset.y = 5;
                break;

            case 'key':
                offset.x = 1;
                offset.y = 6;
                break;

            case 'bomb':
                offset.x = 2;
                offset.y = 8;
                break;

            case 'crate':
                offset.x = 1;
                offset.y = 10;
                break;

            case 'teleport':
                offset.x = 1;
                offset.y = 15;
                break;

            case 'door':
                offset.x = 1;
                offset.y = 8;
                break;

            case 'smokeStart':
                offset.x = 1;
                offset.y = 12;
                break;

            case 'smokeEnd':
                offset.x = 4;
                offset.y = 12;
                break;

            case 'shotX':
                offset.x = 1;
                offset.y = 13;
                break;

            case 'shotY':
                offset.x = 1;
                offset.y = 14;
                break;
        }

        if (type === 'player') {
            offset.x = offset.x - 1 + playerMoveFrame;

            if (playerMoveTimer === 1) {
                playerMoveTimer = 2;

                CONTEXT.drawImage(IMG, offset.x * UNIT, (offset.y - 1) * UNIT, UNIT, UNIT, entity.x * UNIT, entity.y * UNIT, UNIT, UNIT);

                if (playerMoveTimer === 2) {
                    playerMoveTimer = 0;
                    playerMoveFrame = playerMoveFrame ? 0 : 1;

                    drawImage(offset.x, offset.y, entity.x, entity.y);
                }
            }
            else {
                drawImage(offset.x, offset.y, entity.x, entity.y);
            }
        }
        else if (type === 'teleport') {
            if (entityAnimTimer === 6) {
                entityAnimTimer = 0;
                offset.x = offset.x + entityAnimFrame;
            }
            else {
                offset.x = offset.x + entityAnimFrame;
            }

            drawImage(offset.x - 1, offset.y, entity.x, entity.y);
        }
        else if (type === 'smokeStart') {
            if (entity.f < 4) {
                offset.x = entity.f;

                drawImage(offset.x, offset.y, entity.x, entity.y);
            }
            else {
                for (var i = 0; i < entities.smokeStart.length; i++) {
                    if (entity.x === entities.smokeStart[i].x && entity.y === entities.smokeStart[i].y) {
                        entities.smokeStart.splice(i, 1);
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (entity.x === collidable[i].x && entity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }
            }

            entity.f++;
        }
        else if (type === 'smokeEnd') {
            if (entity.f >= 0) {
                offset.x = entity.f;

                drawImage(offset.x, offset.y, entity.x, entity.y);
            }
            else {
                for (var i = 0; i < entities.smokeEnd.length; i++) {
                    if (entity.x === entities.smokeEnd[i].x && entity.y === entities.smokeEnd[i].y) {
                        entities.smokeEnd.splice(i, 1);
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (entity.x === collidable[i].x && entity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }
            }

            entity.f--;
        }
        else if (type === 'shotX' || type === 'shotY') {
            interaction = detectInteraction(entity);
            offset.x = offset.x + entityAnimFrame;

            if (type === 'shotY') {
                switch (entity.d) {
                    case 'up':
                        entity.y -= 1;
                        break;

                    case 'down':
                        entity.y += 1;
                        break;
                }
            }

            if (type === 'shotX') {
                switch (entity.d) {
                    case 'left':
                        entity.x -= 1;
                        break;

                    case 'right':
                        entity.x += 1;
                        break;
                }
            }

            if (interaction === 'collision' || interaction === 'shot') {
                var searchedEntity = {};

                for (var i = 0; i < entities[type].length; i++) {
                    if (entity.x === entities[type][i].x && entity.y === entities[type][i].y) {
                        entities[type].splice(i, 1);
                    }
                }

                for (var i = 0; i < movable.length; i++) {
                    if (entity.x === movable[i].x && entity.y === movable[i].y) {
                        searchedEntity.x = entity.x;
                        searchedEntity.y = entity.y;
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (searchedEntity.x === collidable[i].x && searchedEntity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }

                for (var i = 0; i < shootable.length; i++) {
                    if (entity.x === shootable[i].x && entity.y === shootable[i].y) {
                        shootable.splice(i, 1);
                    }
                }

                if (interaction === 'shot') {
                    performShotSmoke(entity);
                }
            }
            else {
                drawImage(offset.x - 1, offset.y, entity.x, entity.y);
            }
        }
        else {
            drawImage(offset.x - 1, offset.y, entity.x, entity.y);
        }

        entityAnimTimer++;

        if (entityAnimTimer === repeatRate * 3) {
            entityAnimTimer = 0;
            entityAnimFrame = entityAnimFrame ? 0 : 1;
        }
	}

    function drawImage(offsetX, offsetY, x, y) {
        CONTEXT.drawImage(IMG, offsetX * UNIT, (offsetY - 1) * UNIT, UNIT, UNIT, x * UNIT, y * UNIT, UNIT, UNIT);
    }

    function drawFrame() {
        CONTEXT.fillStyle = '#000';
        CONTEXT.fillRect(0, 0, WIDTH * UNIT, HEIGHT * UNIT);

        drawHUD();
        drawArea();
    }

    function playSound(sound) {}

    function gameLoop() {
        var now = new Date().getTime();

        if ((now - lastRun) > repeatRate) {
            drawFrame();

            lastRun = new Date().getTime();
        }

        requestAnimFrame(gameLoop);
    }

    function getPredictedPosition(entity) {
        var predictedPosition = {
            x: entity.x,
            y: entity.y
        };

        switch (entity.d) {
            case 'up':
                predictedPosition.y -= 1;
                break;

            case 'down':
                predictedPosition.y += 1;
                break;

            case 'left':
                predictedPosition.x -= 1;
                break;

            case 'right':
                predictedPosition.x += 1;
                break;
        }

        return predictedPosition;
    }

    function detectInteraction(mover) {
        var moverPredictedPosition = getPredictedPosition(mover),
            interaction = false,
            movedEntity = null,
            collectedEntity = null,
            enteredEntity = null,
            openedEntity = null,
            shootedEntity = null;

        // monsters & movable lasers
        if (!mover.p && !mover.s) {
            if (inArray(moverPredictedPosition, collidable) || inArray(moverPredictedPosition, movable)) {
                interaction = 'collision';
            }
        }
        else {
            // shot
            if (mover.s) {
                if (inArray(moverPredictedPosition, collidable) || (inArray(moverPredictedPosition, movable) && !inArray(moverPredictedPosition, shootable))) {
                    interaction = 'collision';
                }

                if (inArray(moverPredictedPosition, shootable)) {
                    interaction = 'shot';
                }
            }

            // player
            if (mover.p) {
                if (inArray(moverPredictedPosition, collidable)) {
                    interaction = 'collision';
                }

                if (inArray(moverPredictedPosition, movable) && shiftPressed) {
                    interaction = 'collision';
                }
            }
        }

        if (movedEntity = inArray(moverPredictedPosition, movable)) {
            // if shift is pressed then player shouldn't cause entity move
            if (mover.p && !shiftPressed) {
                movedEntity.d = entities.player[0].d;

                switch (movedEntity.d) {
                    case 'up':
                        if (detectInteraction(movedEntity) !== 'collision') {
                            movedEntity.y -= 1;
                            interaction = 'move';
                        }
                        else {
                            interaction = 'collision';
                        }

                        break;

                    case 'down':
                        if (detectInteraction(movedEntity) !== 'collision') {
                            movedEntity.y += 1;
                            interaction = 'move';
                        }
                        else {
                            interaction = 'collision';
                        }

                        break;

                    case 'left':
                        if (detectInteraction(movedEntity) !== 'collision') {
                            movedEntity.x -= 1;
                            interaction = 'move';
                        }
                        else {
                            interaction = 'collision';
                        }

                        break;

                    case 'right':
                        if (detectInteraction(movedEntity) !== 'collision') {
                            movedEntity.x += 1;
                            interaction = 'move';
                        }
                        else {
                            interaction = 'collision';
                        }

                        break;
                }
            }
        }

        if (collectedEntity = inArray(moverPredictedPosition, collectable)) {
            if (mover.p) {
                // ammo
                for (var i = 0; i < entities.ammo.length; i++) {
                    if (collectedEntity.x === entities.ammo[i].x && collectedEntity.y === entities.ammo[i].y) {
                        entities.ammo.splice(i, 1);
                        inventory.ammo += 8;

                        playSound('ammo');
                    }
                }

                // screw
                for (var i = 0; i < entities.screw.length; i++) {
                    if (collectedEntity.x === entities.screw[i].x && collectedEntity.y === entities.screw[i].y) {
                        entities.screw.splice(i, 1);

                        playSound('screw');
                    }
                }

                // key
                for (var i = 0; i < entities.key.length; i++) {
                    if (collectedEntity.x === entities.key[i].x && collectedEntity.y === entities.key[i].y) {
                        entities.key.splice(i, 1);
                        inventory.key++;

                        playSound('key');
                    }
                }

                for (var i = 0; i < collectable.length; i++) {
                    if (collectedEntity.x === collectable[i].x && collectedEntity.y === collectable[i].y) {
                        collectable.splice(i, 1);
                    }
                }

                for (var i = 0; i < shootable.length; i++) {
                    if (collectedEntity.x === shootable[i].x && collectedEntity.y === shootable[i].y) {
                        shootable.splice(i, 1);
                    }
                }

                interaction = 'collect';
            }
            else {
                interaction = 'collision';
            }
        }

        if (enteredEntity = inArray(moverPredictedPosition, enterable)) {
            if (mover.p) {
                for (var i = 0; i < entities.teleport.length; i++) {
                    if (enteredEntity.x === entities.teleport[i].x && enteredEntity.y === entities.teleport[i].y) {
                        performTeleport(enteredEntity, entities.player[0].d);
                    }
                }

                interaction = 'teleport';
            }
            else {
                interaction = 'collision';
            }
        }

        if (openedEntity = inArray(moverPredictedPosition, collidable)) {
            if (mover.p && inventory.key && openedEntity.o) {
                for (var i = 0; i < entities.door.length; i++) {
                    if (openedEntity.x === entities.door[i].x && openedEntity.y === entities.door[i].y) {
                        entities.door.splice(i, 1);
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (openedEntity.x === collidable[i].x && openedEntity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }

                inventory.key--;
                interaction = 'open';

                playSound('door');
            }
            else {
                interaction = 'collision';
            }
        }

        if (shootedEntity = inArray(moverPredictedPosition, shootable)) {
            if (mover.s) {
                for (var i = 0; i < entities.rubble.length; i++) {
                    if (shootedEntity.x === entities.rubble[i].x && shootedEntity.y === entities.rubble[i].y) {
                        entities.rubble.splice(i, 1);
                    }
                }

                for (var i = 0; i < entities.bomb.length; i++) {
                    if (shootedEntity.x === entities.bomb[i].x && shootedEntity.y === entities.bomb[i].y) {
                        entities.bomb.splice(i, 1);
                    }
                }

                for (var i = 0; i < entities.ammo.length; i++) {
                    if (shootedEntity.x === entities.ammo[i].x && shootedEntity.y === entities.ammo[i].y) {
                        entities.ammo.splice(i, 1);
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (shootedEntity.x === collidable[i].x && shootedEntity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }

                for (var i = 0; i < collectable.length; i++) {
                    if (shootedEntity.x === collectable[i].x && shootedEntity.y === collectable[i].y) {
                        collectable.splice(i, 1);
                    }
                }

                for (var i = 0; i < movable.length; i++) {
                    if (shootedEntity.x === movable[i].x && shootedEntity.y === movable[i].y) {
                        movable.splice(i, 1);
                    }
                }

                interaction = 'shot';

                playSound('smoke');
            }
        }

        return interaction;
    }

    function detectTeleportCollision(enteredEntity, arrivalPlace) {
        for (var entity in entities) {
            for (var i = 0; i < entities[entity].length; i++) {
                if (entities[entity][i].x === arrivalPlace.x && entities[entity][i].y === arrivalPlace.y) {
                    return true;
                }
            }
        }

        return false;
    }

    function performTeleport(enteredEntity, direction) {
        var target = null,
            arrivalPlace = {},
            smokeStartEntity = {
                f: 0    // framesCount
            },
            smokeEndEntity = {
                x: entities.player[0].x,
                y: entities.player[0].y,
                f: 3    // framesCount
            };

        for (var i = 0; i < enterable.length; i++) {
            if (enterable[i].i === enteredEntity.t) {
                target = enterable[i];
            }
        }

        switch (direction) {
            case 'up':
                arrivalPlace.x = target.x;
                arrivalPlace.y = target.y - 1;

                if (detectTeleportCollision(enteredEntity, arrivalPlace)) {
                    performTeleport(enteredEntity, 'right');

                    return false;
                }

                break;

            case 'down':
                arrivalPlace.x = target.x;
                arrivalPlace.y = target.y + 1;

                if (detectTeleportCollision(enteredEntity, arrivalPlace)) {
                    performTeleport(enteredEntity, 'left');

                    return false;
                }

                break;

            case 'left':
                arrivalPlace.x = target.x - 1;
                arrivalPlace.y = target.y;

                if (detectTeleportCollision(enteredEntity, arrivalPlace)) {
                    performTeleport(enteredEntity, 'up');

                    return false;
                }

                break;

            case 'right':
                arrivalPlace.x = target.x + 1;
                arrivalPlace.y = target.y;

                if (detectTeleportCollision(enteredEntity, arrivalPlace)) {
                    performTeleport(enteredEntity, 'down');

                    return false;
                }

                break;
        }

        collidable[collidable.length] = smokeEndEntity;
        entities.smokeEnd[entities.smokeEnd.length] = smokeEndEntity;
        entities.player[0].x = -UNIT;
        entities.player[0].y = -UNIT;

        window.setTimeout(function() {
            smokeStartEntity.x = arrivalPlace.x;
            smokeStartEntity.y = arrivalPlace.y;
            collidable[collidable.length] = smokeStartEntity;
            entities.smokeStart[entities.smokeStart.length] = smokeStartEntity;

            window.setTimeout(function() {
                entities.player[0].x = arrivalPlace.x;
                entities.player[0].y = arrivalPlace.y;
            }, repeatRate * 4);
        }, repeatRate * 3);

        playSound('teleport');
    }

    function performShotSmoke(shootedEntity) {
        var smokeStartEntity = {
                x: shootedEntity.x,
                y: shootedEntity.y,
                f: 1    // framesCount
            },
            smokeEndEntity = {
                x: shootedEntity.x,
                y: shootedEntity.y,
                f: 3    // framesCount
            };

        collidable[collidable.length] = smokeStartEntity;
        entities.smokeStart[entities.smokeStart.length] = smokeStartEntity;

        window.setTimeout(function() {
            // we don't need do add smokeEnd to collidables because smokeStart already is with the same coordinates
            entities.smokeEnd[entities.smokeEnd.length] = smokeEndEntity;

            window.setTimeout(function() {
                for (var i = 0; i < entities.smokeStart.length; i++) {
                    if (shootedEntity.x === entities.smokeStart[i].x && shootedEntity.y === entities.smokeStart[i].y) {
                        entities.smokeStart.splice(i, 1);
                    }
                }

                for (var i = 0; i < entities.smokeEnd.length; i++) {
                    if (shootedEntity.x === entities.smokeEnd[i].x && shootedEntity.y === entities.smokeEnd[i].y) {
                        entities.smokeEnd.splice(i, 1);
                    }
                }

                for (var i = 0; i < collidable.length; i++) {
                    if (shootedEntity.x === collidable[i].x && shootedEntity.y === collidable[i].y) {
                        collidable.splice(i, 1);
                    }
                }
            }, repeatRate * 3);
        }, repeatRate * 3);
    }

    function performShoot(shooter) {
        var ammoAvailable = true,
            axis = 'X',
            shotEntity = {
                x: shooter.x,
                y: shooter.y,
                s: true
            };

        if (shooter.p) {
            shotEntity.d = shooter.d; // rifle direction

            if (!inventory.ammo) {
                ammoAvailable = false;
            }
        }

        if (ammoAvailable) {
            if (shotEntity.d === 'up' || shotEntity.d === 'down') {
                axis = 'Y';
            }

//            if (detectInteraction(shooter) !== 'collision') { // when uncommented, it makes unable to shoot entity right next to player
                collidable[collidable.length] = shotEntity;
                entities['shot' + axis][entities['shot' + axis].length] = shotEntity;
//            }

            inventory.ammo--;

            playSound('shot');
        }
    }

    function inputHandler(e) {
        e.preventDefault();

        if (repeatRateTimer == null && controlsEnabled) {
            repeatRateTimer = window.setTimeout(function() {
                switch (e.keyCode) {
                    case 16:  // Shift
                        shiftPressed = true;
                        break;

                    case 38:  // Up
                        setPlayerDirection('up');

                        if (shiftPressed) {
                            performShoot(entities.player[0]);
                        }
                        else {
                            if (entities.player[0].y - 1 >= 1 && detectInteraction(entities.player[0]) !== 'collision') {
                                entities.player[0].y -= 1;
                                playerCollision = false;
                            }
                            else {
                                playerCollision = true;
                            }
                        }

                        break;

                    case 40:  // Down
                        setPlayerDirection('down');

                        if (shiftPressed) {
                            performShoot(entities.player[0]);
                        }
                        else {
                            if (entities.player[0].y + 1 <= AREA_HEIGHT && detectInteraction(entities.player[0]) !== 'collision') {
                                entities.player[0].y += 1;
                                playerCollision = false;
                            }
                            else {
                                playerCollision = true;
                            }
                        }

                        break;

                    case 37:  // Left
                        setPlayerDirection('left');

                        if (shiftPressed) {
                            performShoot(entities.player[0]);
                        }
                        else {
                            if (entities.player[0].x - 1 >= 1 && detectInteraction(entities.player[0]) !== 'collision') {
                                entities.player[0].x -= 1;
                                playerCollision = false;
                            }
                            else {
                                playerCollision = true;
                            }
                        }

                        break;

                    case 39:  // Right
                        setPlayerDirection('right');

                        if (shiftPressed) {
                            performShoot(entities.player[0]);
                        }
                        else {
                            if (entities.player[0].x + 1 <= AREA_WIDTH && detectInteraction(entities.player[0]) !== 'collision') {
                                entities.player[0].x += 1;
                                playerCollision = false;
                            }
                            else {
                                playerCollision = true;
                            }
                        }

                        break;
                }

                repeatRateTimer = null;
            }, repeatRate);
        }
    }

    function shiftReleaseHandler(e) {
        switch (e.keyCode) {
            case 16:  // Shift
                shiftPressed = false;
                break;
        }
    }

    IMG.src = 'robbo.png';
    IMG.onload = function() {
        CANVAS.width = WIDTH * UNIT;
        CANVAS.height = HEIGHT * UNIT;
        CANVAS.addEventListener('keydown', inputHandler, true);
        CANVAS.addEventListener('keyup', shiftReleaseHandler, true);
        CANVAS.focus();

        setLevel(1);
        gameLoop();
    }
})();