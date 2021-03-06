// let sigma = require('sigma');
// (<any>window).sigma = sigma;
// //require('sigma/build/sigma.min.js')
// //require('sigma/build/sigma.require.js')
// require('sigma/plugins/sigma.plugins.dragNodes/sigma.plugins.dragNodes');
// require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
// require('sigma/plugins/sigma.layout.forceAtlas2/worker');


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

//for custom shapes
sigma.canvas.nodes.border = function (node: any, context: any, settings: any) {
    var prefix = settings('prefix') || '';

    context.fillStyle = node.color || settings('defaultNodeColor');
    context.beginPath();
    context.arc(
        node[prefix + 'x'],
        node[prefix + 'y'],
        node[prefix + 'size'],
        0,
        Math.PI * 2,
        true
    );

    context.closePath();
    context.fill();

    // Adding a border
    context.lineWidth = node.borderWidth || 2;
    context.strokeStyle = node.borderColor || '#fff';
    context.stroke();
};
//Initialize sigma
var sigmaInstance = new sigma({
    graph: {
        nodes: [],
        edges: []
    },
    renderer: {
        type: 'canvas',
        container: 'graph-container'
    },
    settings: {
        defaultNodeColor: '#000',
        defaultNodeType: 'border',
        defaultLabelColor: '#fff',
        labelThreshold: 100,
        defaultEdgeColor: '#fff',
        edgeColor: 'default',
        autoRescale: false,
    }
});

sigmaInstance.graph.addNode({
    // Main attributes:
    id: "center",
    label: "center",
    x: 0,
    y: 0,
    size: 20,
    borderColor: getRandomColor()
});

for (let i = 0; i < 5; i++) {
    sigmaInstance.graph.addNode({
        // Main attributes:
        id: "node" + i.toString(),
        label: "node" + i.toString(),
        x: Math.cos(Math.PI * 2 * i / 5)*100,
        y: Math.sin(Math.PI * 2 * i / 5)*100,
        size: 20,
        borderColor: getRandomColor()
    }).addEdge({
        id: 'e' +i.toString(),
        source: "center",
        target: "node"+i.toString(),
        size: 1,
        color:"#fff"
    })
}
//console.log(sigmaInstance.graph.nodes());

//
// for (let i = 0; i < 5; i++) {
//     sigmaInstance.graph.addNode({
//         // Main attributes:
//         id: "node_" + i.toString(),
//         label: "node_" + i.toString(),
//         x: Math.cos(Math.PI * 2 * i / 5),
//         y: Math.sin(Math.PI * 2 * i / 5),
//         size: 20,
//         borderColor: getRandomColor()
//     }).addEdge({
//         id: 'e' +i.toString(),
//         source: "node2",
//         target: "node_"+i.toString(),
//         size: 20,
//         color:"#fff"
//     })
// }

sigmaInstance.refresh();
// var config = {scalingRatio: 50,
//                 gravity: 0}
// sigmaInstance.startForceAtlas2(config);

var config = {
    nodeMargin: 10.0,
    scaleNodes: 2
};

// Configure the algorithm
var listener = sigmaInstance.configNoverlap(config);

console.log(typeof listener);

// Bind all events:
listener.bind('start stop interpolate', function (event:any) {
    console.log(event.type);
});

// Start the algorithm:
sigmaInstance.startNoverlap();