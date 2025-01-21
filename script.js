  class TreeNode {
  constructor(key, value, parent = null, treeName = '') {
    this.key = key; // Unique identifier for the node
    this.value = value; // Display value for the node
    this.parent = parent;
    this.children = [];
    this.treeName = treeName;
  }

  insertChild(childNode, index = -1) {
    childNode.parent = this;
    if (index === -1 || index >= this.children.length) {
      this.children.push(childNode);
    } else {
      this.children.splice(index, 0, childNode);
    }
  }

  findNode(key) {
    if (this.key === key) return this;
    for (let child of this.children) {
      let result = child.findNode(key);
      if (result) return result;
    }
    return null;
  }

  getRootName() {
    if (this.treeName) {
      return this.treeName;
    } else if (this.parent) {
      return this.parent.getRootName();
    }
    return null;
  }
}

class Tree {
  constructor(rootKey, rootValue, name) {
    this.root = new TreeNode(rootKey, rootValue, null, name); // The root node has a name
  }

  // Insert a node at a specific path (find the parent and insert)
  insertNode(parentKey, key, value, index = -1) {
    const newNode = new TreeNode(key, value);
    const parentNode = this.root.findNode(parentKey);
    if (parentNode) {
      parentNode.insertChild(newNode, index);

    } else {
      console.log(`Parent node with key '${parentKey}' not found.`);
    }
  }

  // Render the tree on the canvas
  render(ctx, node = this.root, x = 400, y = 50, offset = 100) {
    const nodeWidth = 50; // Width of each node (e.g., [A])
    const nodeHeight = 30; // Height of each node
    const verticalSpacing = 150; // Spacing between parent and child nodes
    const horizontalSpacing = 100; // Spacing between sibling nodes

    // Draw the node
    
    ctx.fillStyle = "white";
    ctx.fillRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.value, x, y); // Use node.value for display

    ctx.beginPath();
    ctx.arc(x-nodeWidth/2, y - nodeHeight/2, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.label = 'center';
    ctx.fillText(`${x},${y}`, x + 10, y - 10);
    ctx.closePath();
    console.log(`Amount of child nodes: ${node.children.length}`);  
    // Connect with children (if any)
    if (node.children.length > 0) {
      const childrenWidth = node.children.length * horizontalSpacing; // Total width for children
      // 3 child - 3

      // Render each child node
      node.children.forEach((child, index) => {// take 400, 50 as x, y
        let childX = x - childrenWidth / 2 + index * childrenWidth/2;
        if (node.children.length % 2 === 0) {
          childX += horizontalSpacing / 2;
        } else if (node.children.length === 1) {
          childX = x;
        }
        // childX = 400 - 100/2 + 0*100 = 350
        const childY = y + verticalSpacing;
        
        // Draw the connecting line from parent to child
        
        ctx.beginPath(); 
        ctx.moveTo(x, y + nodeHeight / 2); // From parent node
        ctx.lineTo(childX, childY - nodeHeight / 2); // To child node
        ctx.stroke();
        ctx.closePath();
        
        // Recursively render the child node
        this.render(ctx, child, childX, childY, offset);
      });
    }
  }
}

// various canvas shapes
function squaredash(x, y, width, height, id, text = null) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.setLineDash([5, 15]);
  ctx.rect(x, y, width, height);
  ctx.stroke();
  ctx.closePath();
  if (text) {
    ctx.fillText(text, x + width / 2, y + height / 2);
  }
}


document.addEventListener("DOMContentLoaded", function () {
  // Example usage
  const compTree = new Tree("root", "Publish website", "Main Tree"); // key value name
  compTree.insertNode("root", "a", "website"); // parent, key, value
  compTree.insertNode("a", "a1", "v2");
  compTree.insertNode("a1", "a11", "v3");
  compTree.insertNode("a1", "a12", "react js");  

  compTree.insertNode("root", "b", "DNN");
  compTree.insertNode("b", "b1", "CNN");
  compTree.insertNode("b", "b2", "comp vision");
  
  compTree.insertNode("root", "c", "Quantum Computing");
  compTree.insertNode("c", "c1", "learn");
  compTree.insertNode("c1", "c11", "quantum physics");
  compTree.insertNode("c1", "c12", "linear algebra");
  compTree.insertNode("c", "c2", "quantum coding");
  compTree.insertNode("c2", "c21", "concepts");
  compTree.insertNode("c2", "c22", "qiskit");
  
  const mainTree = new Tree("root", "Main Tree", "Main Tree");
  mainTree.insertNode("root", "a", "forecasting");
  mainTree.insertNode("a", "a1", "time series");

  mainTree.insertNode("root", "b", "biochem");

  mainTree.insertNode("root", "c", "physics");
  mainTree.insertNode("c", "c1", "naval shell sim");

  // Function to render a tree on a canvas
  function canvasRender(tree, canvasID) {
    const canvas = document.getElementById(canvasID);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tree.render(ctx);
  }

  // Render the trees on different canvases
  canvasRender(compTree, "treeCanvas1");
  canvasRender(mainTree, "treeCanvas2");
});
