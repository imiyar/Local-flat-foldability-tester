// Generated by CoffeeScript 1.12.5
(function() {
  var CPAssignMV, RBTree, assign, checkCycles, checkFlatFoldability, computeAngle, equalAnglesCrimp, findPairs, findSwaps, getEdge, getEqualAngles, getNonBoundVert, graphlib, isLocalMin, kawasakiCheck, makeCopy, makeCycList, makeGraph, singleCrimp, singleVertAssignMV, solve, swapPairs, updateEqualAngles, yallist;

  getEdge = function() {
    var edge, i, j, k, len, ref, vertices;
    vertices = {};
    for (i = j = 0, ref = verticesNum - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      vertices[i] = [];
    }
    i = 0;
    for (k = 0, len = edges_vertices.length; k < len; k++) {
      edge = edges_vertices[k];
      vertices[edge[0]].push([edge[1], i]);
      vertices[edge[1]].push([edge[0], i]);
      i += 1;
    }
    return vertices;
  };

  getNonBoundVert = function() {
    var edge, i, isBoundary, j, k, len, len1, m, nonBoundVert, ref, ref1, v, vertIndex;
    isBoundary = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = verticesNum.length; j < len; j++) {
        v = verticesNum[j];
        results.push(false);
      }
      return results;
    })();
    for (i = j = 0, len = edges_assignment.length; j < len; i = ++j) {
      edge = edges_assignment[i];
      if (edge === 'B') {
        isBoundary[edges_vertices[i][0]] = true;
        isBoundary[edges_vertices[i][1]] = true;
      }
    }
    nonBoundVert = {};
    for (vertIndex = k = 0, ref = verticesNum - 1; 0 <= ref ? k <= ref : k >= ref; vertIndex = 0 <= ref ? ++k : --k) {
      if (!isBoundary[vertIndex]) {
        nonBoundVert[vertIndex] = [];
        ref1 = vertices[vertIndex];
        for (m = 0, len1 = ref1.length; m < len1; m++) {
          edge = ref1[m];
          nonBoundVert[vertIndex].push({
            start: vertIndex,
            end: edge[0],
            angle: 0,
            id: edge[1]
          });
        }
      }
    }
    return nonBoundVert;
  };

  computeAngle = function(nonBoundVert) {
    var angle, angles, edge, edges, i, j, k, len, len1, len2, m, theta, v, vertIndex, x, y;
    for (vertIndex in nonBoundVert) {
      edges = nonBoundVert[vertIndex];
      for (i = j = 0, len = edges.length; j < len; i = ++j) {
        edge = edges[i];
        v = edge.end;
        x = vertices_coords[v][0] - vertices_coords[vertIndex][0];
        y = vertices_coords[v][1] - vertices_coords[vertIndex][1];
        theta = x === 0 ? Math.PI / 2 : Math.atan(y / x);
        if ((x < 0) || (x === 0 && y < 0)) {
          theta += Math.PI;
        }
        edge.angle = Number((theta * 180 / Math.PI).toFixed(1));
      }
      edges.sort(function(a, b) {
        return a.angle - b.angle;
      });
      angles = [];
      for (i = k = 0, len1 = edges.length; k < len1; i = ++k) {
        edge = edges[i];
        angle = i !== 0 ? edge.angle - edges[i - 1].angle : edge.angle - (edges[edges.length - 1].angle - 360);
        angles.push(angle);
      }
      for (i = m = 0, len2 = edges.length; m < len2; i = ++m) {
        edge = edges[i];
        edge.angle = angles[i];
      }
    }
    return nonBoundVert;
  };

  kawasakiCheck = function() {
    var edge, edgeNum, edges, even, i, j, len, odd, vertIndex;
    for (vertIndex in nonBoundVert) {
      edges = nonBoundVert[vertIndex];
      edgeNum = edges.length;
      if (edgeNum % 2 !== 0) {
        console.log("Not Flat-foldable! There is an odd number of crease around vertex " + vertIndex + ".");
        return false;
      }
    }
    for (vertIndex in nonBoundVert) {
      edges = nonBoundVert[vertIndex];
      even = odd = 0;
      for (i = j = 0, len = edges.length; j < len; i = ++j) {
        edge = edges[i];
        if (i % 2 === 0) {
          even += edge.angle;
        }
        if (i % 2 !== 0) {
          odd += edge.angle;
        }
      }
      if (even !== odd) {
        console.log("Not Flat-foldable! Angles around vertex " + vertIndex + " violate Kawasaki's theorem.");
        return false;
      }
    }
    return true;
  };

  equalAnglesCrimp = function(num, node, bool) {
    var head, i, j, k, numM, ref, ref1;
    node = node.prev;
    head = node.prev;
    if (bool) {
      numM = Math.floor(num / 2) + 1;
    } else {
      if (num % 2 !== 0) {
        num += 1;
      }
      numM = Math.floor(num / 2);
    }
    if (numM > 0) {
      for (i = j = 1, ref = numM; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        edges_assignment[node.value.id] = "M";
        node = node.next;
      }
    }
    if (num - numM > 0) {
      for (i = k = 1, ref1 = num - numM; 1 <= ref1 ? k <= ref1 : k >= ref1; i = 1 <= ref1 ? ++k : --k) {
        edges_assignment[node.value.id] = "V";
        node = node.next;
      }
    }
    head.next = node;
    return node.prev = head;
  };

  makeCycList = function(elts) {
    var list;
    list = yallist(elts);
    list.tail.next = list.head;
    list.head.prev = list.tail;
    return list;
  };

  getEqualAngles = function(length, head) {
    var angles, count, i, j, node, ref;
    angles = [];
    node = head;
    count = 1;
    for (i = j = 1, ref = length; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
      if (node.value.angle === node.next.value.angle) {
        count += 1;
      } else {
        angles.push({
          number: count,
          head: head,
          angle: head.value.angle
        });
        head = node.next;
        count = 1;
      }
      node = node.next;
    }
    return angles;
  };

  isLocalMin = function(node) {
    return node.value.angle < node.prev.value.angle && node.value.angle < node.next.value.angle;
  };

  updateEqualAngles = function(now) {
    var angle;
    if (now.value.number % 2 === 0) {
      if (now.prev !== now.next && now.prev.value.angle === now.next.value.angle) {
        now.prev.value.number += now.next.value.number;
        now.prev.next = now.next.next;
        now.next.next.prev = now.prev;
      } else {
        now.prev.next = now.next;
        now.next.prev = now.prev;
      }
      return now.prev;
    } else {
      angle = now.prev.value.angle - now.value.angle + now.next.value.angle;
      now.value = {
        number: 1,
        head: now.value.head,
        angle: angle
      };
      now.prev.value.number -= 1;
      now.next.value.number -= 1;
      if (now.prev.value.number === 0) {
        now.prev.prev.next = now;
        now.prev = now.prev.prev;
      }
      if (now.next.value.number === 0) {
        now.next.next.prev = now;
        now.next = now.next.next;
      } else {
        now.next.value.head = now.next.value.head.next;
      }
      if (now.prev !== now && now.prev.value.angle === now.value.angle) {
        now.prev.value.number += now.value.number;
        now.prev.next = now.next;
        now.next.prev = now.prev;
        now = now.prev;
      }
      if (now !== now.next && now.value.angle === now.next.value.angle) {
        now.value.number += now.next.value.number;
        now.next = now.next.next;
        now.next.next.prev = now;
      }
      return now;
    }
  };

  assign = function(head, localMin) {
    var newNode, now;
    if (head.next === head) {
      return equalAnglesCrimp(head.value.number, head.value.head, true);
    } else {
      now = localMin.shift();
      equalAnglesCrimp(now.value.number, now.value.head, false);
      newNode = updateEqualAngles(now);
      if (isLocalMin(newNode)) {
        localMin.push(newNode);
      }
      if (isLocalMin(newNode.next)) {
        localMin.push(newNode.next);
      }
      if (isLocalMin(newNode.prev)) {
        localMin.push(newNode.prev);
      }
      return assign(newNode, localMin);
    }
  };

  singleVertAssignMV = function(nonBoundVert) {
    var angleList, angles, edges, head, i, j, list, localMin, node, ref, results, vertIndex;
    results = [];
    for (vertIndex in nonBoundVert) {
      edges = nonBoundVert[vertIndex];
      list = makeCycList(edges);
      head = list.head;
      if (head.value.angle === head.next.value.angle) {
        head = head.next;
        while (head !== list.head) {
          if (head.value.angle === head.next.value.angle) {
            head = head.next;
          } else {
            break;
          }
        }
      }
      head = head.next;
      angles = getEqualAngles(list.length, head);
      angleList = makeCycList(angles);
      localMin = [];
      node = angleList.head;
      for (i = j = 1, ref = angles.length; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        if (isLocalMin(node)) {
          localMin.push(node);
        }
        node = node.next;
      }
      results.push(assign(angleList.head, localMin));
    }
    return results;
  };

  singleCrimp = function(node, BST) {
    var angle, head;
    BST.remove(node);
    BST.remove(node.prev);
    if (node.prev === node.next) {
      return [node.value.id, node.prev.value.id, 1];
    } else {
      BST.remove(node.next);
      angle = node.prev.value.angle - node.value.angle + node.next.value.angle;
      node.next.value.angle = angle;
      BST.insert(node.next);
      head = node.prev.prev;
      head.next = node.next;
      node.next.prev = head;
      return [node.value.id, node.prev.value.id, -1];
    }
  };

  makeCopy = function(nonBoundVert_0) {
    var edge, edgeList, edges, i, j, len, newEdge, nonBoundVert, vertIndex;
    nonBoundVert = {};
    edgeList = {};
    for (vertIndex in nonBoundVert_0) {
      edges = nonBoundVert_0[vertIndex];
      nonBoundVert[vertIndex] = [];
      for (i = j = 0, len = edges.length; j < len; i = ++j) {
        edge = edges[i];
        newEdge = {
          start: nonBoundVert_0[vertIndex][i].start,
          end: nonBoundVert_0[vertIndex][i].end,
          angle: nonBoundVert_0[vertIndex][i].angle,
          id: nonBoundVert_0[vertIndex][i].id
        };
        nonBoundVert[vertIndex].push(newEdge);
        edgeList[newEdge.id] = newEdge;
      }
    }
    return [nonBoundVert, edgeList];
  };

  findPairs = function(nonBoundVert) {
    var RBT, edges, head, list, minima, node, pairs, vertIndex, vertList;
    vertList = {};
    for (vertIndex in nonBoundVert) {
      edges = nonBoundVert[vertIndex];
      list = makeCycList(edges);
      head = list.head;
      vertList[vertIndex] = head;
    }
    RBT = new RBTree(function(l, r) {
      if (l.value.angle !== r.value.angle) {
        return l.value.angle - r.value.angle;
      } else {
        return l.value.end - r.value.end;
      }
    });
    for (vertIndex in vertList) {
      head = vertList[vertIndex];
      RBT.insert(head);
      node = head.next;
      while (node !== head) {
        RBT.insert(node);
        node = node.next;
      }
    }
    pairs = [];
    minima = RBT.min();
    while (minima !== null) {
      pairs.push(singleCrimp(minima, RBT));
      minima = RBT.min();
    }
    return pairs;
  };

  checkCycles = function(components, g) {
    var component, cycle, cycles, flag, i, isPath, j, k, len, len1, len2, len3, m, n, vert;
    cycles = [];
    for (j = 0, len = components.length; j < len; j++) {
      component = components[j];
      isPath = false;
      if (component.length >= 3) {
        for (k = 0, len1 = component.length; k < len1; k++) {
          vert = component[k];
          if (g.neighbors(vert).length === 1) {
            isPath = true;
            break;
          }
        }
        if (!isPath) {
          cycles.push(component);
        }
      }
    }
    for (m = 0, len2 = cycles.length; m < len2; m++) {
      cycle = cycles[m];
      flag = 1;
      for (i = n = 0, len3 = cycle.length; n < len3; i = ++n) {
        vert = cycle[i];
        flag *= i === 0 ? g.edge({
          v: vert,
          w: cycle[cycle.length - 1]
        }) : g.edge({
          v: vert,
          w: cycle[i - 1]
        });
      }
      if (flag < 0) {
        return false;
      }
    }
    return true;
  };

  findSwaps = function(vertList) {
    var head, node, swaps, vertIndex;
    swaps = [];
    for (vertIndex in vertList) {
      head = vertList[vertIndex];
      if (head.value.angle === head.next.value.angle) {
        swaps.push([head.prev.value.id, head.next.value.id]);
      }
      node = head.next;
      while (node !== head) {
        if (node.value.angle === node.next.value.angle) {
          swaps.push([node.prev.value.id, node.next.value.id]);
        }
        node = node.next;
      }
    }
    console.log(swaps);
    return swaps;
  };

  swapPairs = function(pairs, swap, edgeList) {
    var edge1, edge2, elt, first, firsts, j, k, len, len1, len2, m, pair, pos1, pos2, ref, ref1, second, seconds;
    firsts = [];
    seconds = [];
    for (j = 0, len = pairs.length; j < len; j++) {
      pair = pairs[j];
      if ((ref = swap[0]) === pair[0] || ref === pair[1]) {
        firsts.push(pair);
      } else if ((ref1 = swap[1]) === pair[0] || ref1 === pair[1]) {
        seconds.push(pair);
      }
    }
    for (k = 0, len1 = firsts.length; k < len1; k++) {
      first = firsts[k];
      if (first[0] === swap[0]) {
        pos1 = 0;
        edge1 = first[1];
      } else {
        pos1 = 1;
        edge1 = first[0];
      }
      for (m = 0, len2 = seconds.length; m < len2; m++) {
        second = seconds[m];
        if (second[0] === swap[1]) {
          pos2 = 0;
          edge2 = second[1];
        } else {
          pos2 = 1;
          edge2 = second[0];
        }
        if (edgeList[edge1].start === edgeList[edge2].start || edgeList[edge1].start === edgeList[edge2].end || edgeList[edge1].end === edgeList[edge2].start || edgeList[edge1].end === edgeList[edge2].end) {
          elt = first[pos1];
          first[pos1] = second[pos2];
          second[pos2] = elt;
          return pairs;
        }
      }
    }
  };

  makeGraph = function(pairs) {
    var g, j, len, pair;
    g = new graphlib.Graph({
      directed: false
    });
    for (j = 0, len = pairs.length; j < len; j++) {
      pair = pairs[j];
      g.setEdge(pair[0], pair[1], pair[2]);
    }
    return g;
  };

  checkFlatFoldability = function(nonBoundVert, pairs) {
    var components, edgeNum, edges, g, head, j, len, list, numComp, swap, swaps, vertIndex, vertList;
    g = makeGraph(pairs);
    edgeNum = g.nodeCount();
    components = graphlib.alg.components(g);
    numComp = components.length;
    if (!checkCycles(components, g)) {
      vertList = {};
      for (vertIndex in nonBoundVert) {
        edges = nonBoundVert[vertIndex];
        list = makeCycList(edges);
        head = list.head;
        vertList[vertIndex] = head;
      }
      swaps = findSwaps(vertList);
      for (j = 0, len = swaps.length; j < len; j++) {
        swap = swaps[j];
        pairs = swapPairs(pairs, swap, edgeList);
        g = makeGraph(pairs);
        console.log(components = graphlib.alg.components(g));
        if (components.length < numComp) {
          numComp = components.length;
          if (checkCycles(components, g)) {
            return [true, components, g];
          }
        } else {
          pairs = swapPairs(pairs, swap, edgeList);
        }
      }
      console.log("No locally flat-foldable mountain–valley assignment!");
      return [false, null, null];
    }
    return [true, components, g];
  };

  CPAssignMV = function(edges_assignment, components, g) {
    var assignMV, component, j, len, results;
    results = [];
    for (j = 0, len = components.length; j < len; j++) {
      component = components[j];
      assignMV = function(node, label) {
        var k, len1, neighbor, neighbors, nextLabel, results1;
        edges_assignment[node] = label === 1 ? "M" : "V";
        neighbors = g.neighbors(node);
        results1 = [];
        for (k = 0, len1 = neighbors.length; k < len1; k++) {
          neighbor = neighbors[k];
          if (edges_assignment[neighbor] === "U") {
            nextLabel = g.edge(node, neighbor);
            results1.push(assignMV(neighbor, label * nextLabel));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      };
      results.push(assignMV(component[0], 1));
    }
    return results;
  };

  yallist = require("yallist");

  RBTree = require("bintrees").RBTree;

  graphlib = require("graphlib");

  solve = function(creasePattern) {
    var components, edgeList, edges_assignment, edges_vertices, flatFoldable, g, nonBoundVert, nonBoundVertForCrimp, pairs, ref, ref1, vertices, verticesNum, vertices_coords;
    vertices_coords = creasePattern.vertices_coords;
    edges_vertices = creasePattern.edges_vertices;
    edges_assignment = creasePattern.edges_assignment;
    verticesNum = vertices_coords.length;
    vertices = getEdge();
    nonBoundVert = getNonBoundVert();
    nonBoundVert = computeAngle(nonBoundVert);
    if (kawasakiCheck(nonBoundVert)) {
      if (Object.keys(nonBoundVert).length === 1) {
        singleVertAssignMV(nonBoundVert);
        console.log(edges_assignment);
        return edges_assignment;
      } else {
        ref = makeCopy(nonBoundVert), nonBoundVertForCrimp = ref[0], edgeList = ref[1];
        console.log(nonBoundVertForCrimp);
        pairs = findPairs(nonBoundVertForCrimp);
        g = makeGraph(pairs);
        ref1 = checkFlatFoldability(nonBoundVert, pairs, edgeList), flatFoldable = ref1[0], components = ref1[1], g = ref1[2];
        if (flatFoldable) {
          CPAssignMV(edges_assignment, components, g);
          console.log(edges_assignment);
          return edges_assignment;
        }
      }
    }
  };

}).call(this);
