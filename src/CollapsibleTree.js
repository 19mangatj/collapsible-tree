
import React from 'react';
import * as d3 from 'd3';
import { dummyPosts, dummyRelations } from "./data/postDummyData";
import data from "./data/data"


function CollapsibleTree() {
    const svgRef = React.useRef()
    const width = 800
    const height = 800


    React.useEffect(() => {
        var dx = 50
        var dy = width / 6
        var diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
        var tree = d3.tree().nodeSize([dx, dy])
        var margin = ({ top: 10, right: 120, bottom: 10, left: 40 })

        // not a valid way to pass in data; need to use alg to reformat
        // dummyPosts into a JSON for d3.hierarchy()

        var pack = (data) =>
            d3
                .pack()
                .size([width - 2, height - 2])
                .padding(3)(
                    d3
                        .hierarchy(data)
                        .sum((d) => d.value)
                        .sort((a, b) => b.value - a.value)
                );

       const root = pack(formatData(dummyPosts, dummyRelations));
//        const root = d3.hierarchy(data);

        // nested data structure that creates a tree
        // const root = d3.hierarchy(data);

        // sets
        root.x0 = dy / 2;
        root.y0 = 100000;
        // root.descendants() returns an array of descendant nodes; the root is the first member
        // d is a node
        root.descendants().forEach((d, i) => {
            // each node has a unique identifier
            d.id = i;
            d._children = d.children;
            // NOT SURE WHAT THIS IS ABOUT
            if (d.depth && d.data.title.length !== 7) d.children = null;
        });

        // setting up the front end
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-margin.left, -margin.top, width, dx])
            .style("font", "10px sans-serif")
            .style("user-select", "none");

        const gLink = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);

        const gNode = svg.append("g")
            .attr("cursor", "pointer")
            .attr("pointer-events", "all");


        function update(source) {
            // d3.event is the current event being invoked; d3.event.altKey is whether or not alt was pressed; overall determines the duration
            // not sure what the point is
            // d3.event && d3.event.altKey ? 2500 : 250;
            const duration = 250;

            const nodes = root.descendants().reverse();
            // returns an array of objects representing the given node's descendant's links
            // Each link object�s link.source is a child and link.target is its parent
            const links = root.links();

            // Compute the new tree layout.
            tree(root);

            let left = root;
            let right = root;
            // Invokes the specified function for node and each descendant in pre-order traversal, such that a given node is only visited after all of its ancestors have already been visited.
            root.eachBefore(node => {
                if (node.x < left.x) left = node;
                if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + margin.top + margin.bottom;

            // took out .ResizeObserver after window; need to figure out what it does
            const transition = svg.transition()
                .duration(duration)
                .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
                .tween("resize", window
                    ? null : () => () => svg.dispatch("toggle"));

            // Update the nodes�
            const node = gNode.selectAll("g")
                .data(nodes, d => d.id);

            // Enter any new nodes at the parent's previous position.
            const nodeEnter = node.enter().append("g")
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .on("dblclick", (event, d) => {
                    d.children = d.children ? null : d._children;
                    update(d);
                });
           

            nodeEnter.append("text")
                .attr("dy", "0.61em")
                .attr("x", d => d._children ? -16 : 16)
                .attr("text-anchor", d => d._children ? "end" : "start")
                .text(function (d) {
                    console.log(d.data.title)
                    console.log(d.data.type)
                    if (d.data.type == "Topic") {
                        console.log("topic reached")
                        addSVG(nodeEnter,
                            "https://raw.githubusercontent.com/google/material-design-icons/master/src/hardware/device_hub/materialicons/24px.svg", "#FFCC66")
                    }
                    if (d.data.type == "Idea") {
                        console.log("idea reached")
                        addSVG(nodeEnter,
                            "https://raw.githubusercontent.com/google/material-design-icons/master/src/social/emoji_objects/materialicons/20px.svg", "#3366FF")
                    }
                    return d.data.title
                })
                .clone(true).lower()
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .attr("stroke", "white");


            // Transition nodes to their new position.
            const nodeUpdate = node.merge(nodeEnter).transition(transition)
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            const nodeExit = node.exit().transition(transition).remove()
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0);

            // Update the links�
            const link = gLink.selectAll("path")
                .data(links, d => d.target.id);

            // Enter any new links at the parent's previous position.
            const linkEnter = link.enter().append("path")
                .attr("d", d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            // Transition links to their new position.
            link.merge(linkEnter).transition(transition)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition(transition).remove()
                .attr("d", d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                });

            // Stash the old positions for transition.
            root.eachBefore(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        update(root);
    }, []);

 
    return (
        <React.Fragment>
            <svg ref={svgRef} width={width} height={height}></svg>
        </React.Fragment>
    );


}





function addSVG(nodeEnter, link, color) {
    nodeEnter.append("image")
        .attr("xlink:href", link)
        .attr("r", 2.5)
        .attr("y", -14)
        .attr("x", -16)
        .style("fill", color)

}

//function formatdata(posts, relations) {
//    //array containing the root objects (the parents)
//    let roots = [];

//    //map to get posts by id {postid, postobject}
//    let postsmap = new map();

//    //map each post by id
//    posts.foreach((post) => {
//        //give each post object a children array
//        post.children = [];
//        post.value = math.floor(math.random() * 100);

//        //map each post by its id
//        postsmap.set(post._id, post);

//        //fill the roots array with all posts
//        roots.push(post);
//    });

//    for (let i = 0; i < relations.length; i++) {
//        let parent = postsmap.get(relations[i].post1);
//        let child = postsmap.get(relations[i].post2);

//        parent.children.push(child);
//        if (roots.includes(child)) roots.splice(roots.indexof(child), 1);
//    }

//    return roots.length === 1 ? roots[0] : { value: 1, children: roots };
//}

function formatData(posts, relations) {
    //Array containing the root objects (the parents)
    let roots = [];

    //map to get posts by id {postID, postObject}
    let postsMap = new Map();

    let colorMap = new Map();
    colorMap.set("Idea", "rgb(51,102,255)");
    colorMap.set("Topic", "rgb(255,204,102)");
    colorMap.set("Concern", "rgb(255,0,0)");
    colorMap.set("Information", "rgb(224,224,209)");
    colorMap.set("Action Item", "");
    colorMap.set("Event", "");
    colorMap.set("Question", "");

    let iconMap = new Map();
    iconMap.set("Idea", "emoji_objects");
    iconMap.set("Topic", "device_hub");
    iconMap.set("Concern", "error");
    iconMap.set("Information", "info");
    iconMap.set("Action Item", "check_circle");
    iconMap.set("Event", "event");
    iconMap.set("Question", "help");

    //map each post by ID
    posts.forEach((post) => {
        //give each post object a children array
        post.children = [];
        post.value = Math.floor(Math.random() * 100 + 50);
        post.color = colorMap.get(post.type);
        post.icon = iconMap.get(post.type);

        //map each post by its ID
        postsMap.set(post._id, post);

        //fill the roots array with all posts
        roots.push(post);
    });

    for (let i = 0; i < relations.length; i++) {
        let parent = postsMap.get(relations[i].post1);
        let child = postsMap.get(relations[i].post2);

        parent.children.push(child);
        if (roots.includes(child)) roots.splice(roots.indexOf(child), 1);
    }

    return roots.length === 1
        ? roots[0]
        : {
            value: 1,
            children: roots,
        };
}
export default CollapsibleTree;
