import {action, execute, neg_guard, Precondition, selector, Tick} from "./scripting";

/*------------------------------------------------*/
/*

    1--2-|-3--4
           |
       6-|-5
 */

var connected = {
    1: [2],
    2: [1, 3],
    3: [2, 4, 5],
    4: [3],
    5: [3, 6],
    6: [5]
}

var locked = {2: 3, 3: 2, 5: 6, 6: 5}

var visited = {
    a: [1],
    b: [5]
}

var key = {
    a: false,
    b: false
}

var currentLocation = {
    a: 1,
    b: 5,
    key: 2
}

var keyAskedFrom = {}

function getNextTowardsGoal(current, goal) {
    if (goal == 4) {
        switch (current) {
            case 1:
                return 2;

            case 2:
                return 3;

            case 3:
                return 4;
        }
    }
    if (goal == 6) {
        switch (current) {
            case 5:
                return 6;

            case 3:
                return 5;

            case 4:
                return 3;
        }
    }
}

function getNextToExplore(agent){
    var neighbors = connected[currentLocation[agent]];
    for(var i=0; i<neighbors.length; i++){
        if(!includes(visited[agent], neighbors[i]) && locked[neighbors[i]] != currentLocation[agent])
            return neighbors[i];
    }
}

function visit(visited, current) {
    visited[current] = true;
    var neighbors = connected[current];
    for(var i=0; i<neighbors.length; i++){
        if(visited[neighbors[i]] == undefined && locked[neighbors[i]] != current)
            visit(visited, neighbors[i]);
    }
}

let atGoal: Precondition = (params) => {
    return currentLocation[params.agent] == params.goal
}

let pathOpen:Precondition = (params) => {
    var visited = {};
    visit(visited, currentLocation[params.agent]);

    //console.log(params.agent+" Path open: "+(visited[params.goal] == true || key[params.agent] == true));
    return visited[params.goal] == true || key[params.agent] == true;
}

let moveTowardsGoal: (params: any) => Tick = (params) =>
    action(
        (params) => {
            var agent = params.agent;
            var current = currentLocation[agent];
            var next = getNextTowardsGoal(current, params.goal);
            // console.log("moveTowardsGoal: " + (current == next
            //     || (connected[current].includes(next) && locked[current] != next)));
            return current == next
                || (connected[current].includes(next) && locked[current] != next);
        },
        (params) => {
            var destination = getNextTowardsGoal(currentLocation[params.agent], params.goal);
            console.log(params.agent + " moves to " + destination);
            currentLocation[params.agent] = destination;
        },
        params, 0
    );

let explore: (params: any) => Tick = (params) =>
    action(
        (params) => {
            var agent = params.agent;
            var next = getNextToExplore(agent);
            // console.log("explore: " + (next != undefined));
            return next != undefined;
        },
        (params) => {
            var agent = params.agent;
            var next = getNextToExplore(agent);
            currentLocation[params.agent] = next;
            console.log(params.agent + " moves to " + next);
        },
        params, 0
    );

let askKey: (params: any) => Tick = (params) =>
    action(
        (params) => {
            // console.log("pickupKey: " + (currentLocation[params.agent] == currentLocation[params.other] && key[params.other]));
            return currentLocation[params.agent] == currentLocation[params.other] && key[params.other];
        },
        (params) => {
            console.log(params.agent + " asks for the key from "+params.other);
            keyAskedFrom[params.other] = params.agent
        },
        params, 0
    );

let giveKey: (params: any) => Tick = (params) =>
    action(
        (params) => {
            // console.log("giveKey: " + (key[params.agent] && currentLocation[params.agent] == currentLocation[params.other] && keyAskedFrom[params.agent] == params.other));
            return key[params.agent] && currentLocation[params.agent] == currentLocation[params.other] && keyAskedFrom[params.agent] == params.other;
        },
        (params) => {
            console.log(params.agent + " gives the key to "+params.other);
            delete keyAskedFrom[params.agent];
            key[params.agent] = false;
            key[params.other] = true;
        },
        params, 0
    );

let pickupKey: (params: any) => Tick = (params) =>
    action(
        (params) => {
            var agent = params.agent;
            var current = currentLocation[agent];
            var keyLocation = currentLocation.key;
            // console.log("pickupKey: " + (current == keyLocation));
            return current == keyLocation;
        },
        (params) => {
            console.log(params.agent + " picks up the key.");
            key[params.agent] = true;
            delete currentLocation.key;
        },
        params, 0
    );

let useKey: (params: any) => Tick = (params) =>
    action(
        (params) => {
            var agent = params.agent;
            var current = currentLocation[agent];
            var next = getNextTowardsGoal(current, params.goal);
            // console.log("useKey: " + (current != next && locked[current] == next && key[agent]));
            return current != next && locked[current] == next && key[agent];
        },
        (params) => {
            var agent = params.agent;
            console.log(agent + " uses the key.");
            var lockedLoc = locked[currentLocation[agent]];
            delete locked[currentLocation[agent]];
            delete locked[lockedLoc];
        },
        params, 0
    );

//agent tree
function getAgentTree(params){
    return neg_guard(atGoal, params,
        selector([
            neg_guard(pathOpen, params,   //no key
                selector([
                    pickupKey({}),
                    askKey(params),
                    explore({})
                ])),
            selector([
                useKey(params),
                giveKey(params),
                moveTowardsGoal(params)
            ])
        ])
    );
}

var blackboard: any = {};

function runWorldTick() {
    var aTree = getAgentTree({goal: 4, other: "b"});
    execute(aTree, "a", blackboard);
    var bTree = getAgentTree({goal: 6, other: "a"});
    execute(bTree, "b", blackboard);
}

for (var i = 0; i < 7; i++) {
    runWorldTick();
}


/*------*/
function includes(arr, elem){
    for(var i=0; i<arr.length; i++){
        if(arr[i] == elem)
            return true;
    }
    return false;
}