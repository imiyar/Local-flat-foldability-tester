getEdge = ->
	# Get all the vertices and their connected vertices
	vertices = {}
	vertices[i] = [] for i in [0..verticesNum-1]
	i = 0
	for edge in edges_vertices
		vertices[edge[0]].push [edge[1], i]
		vertices[edge[1]].push [edge[0], i]
		i += 1
	vertices

getNonBoundVert = ->
	# Get all the non-boundary vertices and the connected edges
	isBoundary = (false for v in verticesNum)
	for edge, i in edges_assignment
		if edge == 'B'
			isBoundary[edges_vertices[i][0]] = true
			isBoundary[edges_vertices[i][1]] = true

	# Each edge is an object with attributes: 
	# {startVert, endVert, theta(polar coordinate system), M-V assignment}
	nonBoundVert = {}
	for vertIndex in [0..verticesNum-1]
		if not isBoundary[vertIndex]
			nonBoundVert[vertIndex] = []
			for edge in vertices[vertIndex]
				nonBoundVert[vertIndex].push {
					start: vertIndex, 
					end: edge[0], 
					angle: 0,
					id: edge[1]}
	nonBoundVert

computeAngle = (nonBoundVert) ->
	for vertIndex, edges of nonBoundVert
		# Compute theta in polar coordinate system
		for edge, i in edges
			v = edge.end
			x = vertices_coords[v][0] - vertices_coords[vertIndex][0]
			y = vertices_coords[v][1] - vertices_coords[vertIndex][1]
			theta = if x == 0 then Math.PI / 2 else Math.atan y / x
			theta += Math.PI if (x < 0) or (x == 0 and y < 0)
			edge.angle = Number((theta * 180 / Math.PI).toFixed(1))

		# Sort the edges in anti-clockwise order
		edges.sort (a, b) ->
			a.angle - b.angle

		# Compute the angle between edges
		angles = []
		for edge, i in edges
			angle = if i != 0 then edge.angle - edges[i-1].angle else edge.angle - (edges[edges.length-1].angle - 360)
			angles.push angle
		for edge, i in edges
			# attribute: {startVert, endVert, right angle, M-V assignment}
			edge.angle = angles[i]
	nonBoundVert

kawasakiCheck = ->
	# Check the total number of angles around a vertex
	for vertIndex, edges of nonBoundVert
		edgeNum = edges.length
		if edgeNum % 2 != 0
			console.log "Not Flat-foldable! There is an odd number of crease around vertex #{vertIndex}."
			return false

	# Check if alternating sum of the angles is equal to 0
	for vertIndex, edges of nonBoundVert
		even = odd = 0
		for edge, i in edges
			even += edge.angle if i % 2 == 0
			odd += edge.angle if i % 2 != 0	

		if even != odd
			console.log "Not Flat-foldable! Angles around vertex #{vertIndex} violate Kawasaki's theorem."
			return false
	return true

equalAnglesCrimp = (num, node, bool) ->
	# bool represent whether the circular list has just one item or not
	# Get the left side edge of this angle
	node = node.prev
	head = node.prev

	# Compute the number of mountain edge (assume mountain > valley)
	if bool
		numM = num // 2 + 1
	else
		num += 1 if num % 2 != 0
		numM = num // 2

	# Randomly select numM edges and assign them mountain
	# Assign the rest of edges valley
	if numM > 0
		for i in [1..numM]
			edges_assignment[node.value.id] = "M"
			node = node.next

	if num-numM > 0
		for i in [1..num-numM]
			edges_assignment[node.value.id] = "V"
			node = node.next

	# Crimp all the smme angles
	head.next = node
	node.prev = head

makeCycList = (elts) ->
	# Turn a linked list into a circular list
	list = yallist elts
	list.tail.next = list.head
	list.head.prev = list.tail
	list

getEqualAngles = (length, head) ->
	# return a circular list in which each item represents a maximal coalescing of consecutive equal angles
	# attribute: {maximal number of equal angles, head node, angle degree}
	angles = []
	node = head
	count = 1
	for i in [1..length]
		if node.value.angle == node.next.value.angle
			count += 1
		else 
			angles.push {
				number: count,
				head: head,
				angle: head.value.angle}
			head = node.next
			count = 1
		node = node.next
	angles

isLocalMin = (node) ->
	# Return whether the angles are strict local minima
	node.value.angle < node.prev.value.angle and node.value.angle < node.next.value.angle

updateEqualAngles = (now) ->
	# Update the circular list of consecutive equal angles
	# Even number 
	if now.value.number % 2 == 0	
		if now.prev != now.next and now.prev.value.angle == now.next.value.angle
			# Merge two groups of consecutive equal angles
			now.prev.value.number += now.next.value.number
			now.prev.next = now.next.next
			now.next.next.prev = now.prev
		else
			# Link the prev and the next group
			now.prev.next = now.next
			now.next.prev = now.prev
		return now.prev

	# Odd number
	else
		# Compute new angle degree
		angle = now.prev.value.angle - now.value.angle + now.next.value.angle
		now.value = {
			number: 1,
			head: now.value.head,
			angle: angle}

		# Delete empty group
		now.prev.value.number -= 1
		now.next.value.number -= 1
		if now.prev.value.number == 0
			now.prev.prev.next = now
			now.prev = now.prev.prev
		if now.next.value.number == 0
			now.next.next.prev = now
			now.next = now.next.next	
		else
			now.next.value.head = now.next.value.head.next

		#Merge two groups of consecutive equal angles
		if now.prev != now and now.prev.value.angle == now.value.angle
			now.prev.value.number += now.value.number
			now.prev.next = now.next
			now.next.prev = now.prev
			now = now.prev
		if now != now.next and now.value.angle == now.next.value.angle
			now.value.number += now.next.value.number
			now.next = now.next.next
			now.next.next.prev = now
		return now

assign = (head, localMin) ->
	# Boundary condition: only one item left in the circular list
	if head.next == head
		equalAnglesCrimp head.value.number, head.value.head, true
	else
		# Take the ﬁrst item from the list of local minima and do crimping
		now = localMin.shift()
		equalAnglesCrimp now.value.number, now.value.head, false

		# Update the circular list of consecutive equal angles
		newNode = updateEqualAngles now

		# Check new local minima and update the list of local minima
		localMin.push newNode if isLocalMin newNode
		localMin.push newNode.next if isLocalMin newNode.next
		localMin.push newNode.prev if isLocalMin newNode.prev

		# Recursion
		assign(newNode, localMin)


singleVertAssignMV = (nonBoundVert) ->
	for vertIndex, edges of nonBoundVert
		# Find the first different neighbour
		list = makeCycList edges
		head = list.head
		if head.value.angle == head.next.value.angle
			head = head.next
			while head != list.head
				if head.value.angle == head.next.value.angle
					head = head.next
				else
					break
		head = head.next

		#  Make a circular list in which each item represents a maximal coalescing of consecutive equal angles
		angles = getEqualAngles list.length, head
		angleList = makeCycList angles

		# Make a list of local minima
		localMin = []
		node = angleList.head
		for i in [1..angles.length]
			if isLocalMin node
				localMin.push node
			node = node.next

		# Crimp Local minima and randomly assign MV
		assign angleList.head, localMin

singleCrimp = (node, BST) ->
	# Remove the crimped node in the BST
	BST.remove(node)
	BST.remove(node.prev)

	# Boundary condition: only two angles left
	if node.prev == node.next
		return [node.value.id, node.prev.value.id, 1]	# 1 means same MV assignment
	else
		# Update values in BST
		BST.remove(node.next)
		angle = node.prev.value.angle - node.value.angle + node.next.value.angle		
		node.next.value.angle = angle
		BST.insert(node.next)

		# Crimp angle
		head = node.prev.prev
		head.next = node.next
		node.next.prev = head

		return [node.value.id, node.prev.value.id, -1] # -1 means different MV assignment

makeCopy = (nonBoundVert_0) ->
	nonBoundVert = {}
	edgeList = {}
	for vertIndex, edges of nonBoundVert_0
		nonBoundVert[vertIndex] = []
		for edge, i in edges
			newEdge = {
				start: nonBoundVert_0[vertIndex][i].start, 
				end: nonBoundVert_0[vertIndex][i].end, 
				angle: nonBoundVert_0[vertIndex][i].angle,
				id: nonBoundVert_0[vertIndex][i].id}
			nonBoundVert[vertIndex].push newEdge
			edgeList[newEdge.id] = newEdge
	[nonBoundVert, edgeList]

findPairs = (nonBoundVert) ->
	# Make a circular list for angles around each vertex
	vertList = {}
	for vertIndex, edges of nonBoundVert
		list = makeCycList edges
		head = list.head
		vertList[vertIndex] = head

	# Create a RBT
	RBT = new RBTree (l, r) ->
		if l.value.angle != r.value.angle
			return l.value.angle - r.value.angle
		else 
			return l.value.end - r.value.end

	for vertIndex, head of vertList
		RBT.insert head
		node = head.next
		while node != head
			RBT.insert node
			node = node.next

	# Find global minima and pair the edges
	pairs = []
	minima = RBT.min()
	while minima != null
		pairs.push(singleCrimp minima, RBT)
		minima = RBT.min()

	pairs

checkCycles = (components, g)->
	# Get all cycles
	cycles = []
	for component in components
		isPath = false
		if component.length >= 3
			for vert in component
				if g.neighbors(vert).length == 1
					isPath = true
					break
			cycles.push component if not isPath

	# Check cycles
	for cycle in cycles
		flag = 1
		for vert, i in cycle
			flag *= if i == 0 then g.edge {v: vert, w: cycle[cycle.length-1]} else g.edge {v: vert, w: cycle[i-1]}
		return false if flag < 0
	return true

findSwaps = (vertList) ->
	# Find possible swaps
	swaps = []
	for vertIndex, head of vertList
		if head.value.angle == head.next.value.angle
			swaps.push [head.prev.value.id, head.next.value.id] 
		node = head.next

		while node != head
			if node.value.angle == node.next.value.angle
				swaps.push [node.prev.value.id, node.next.value.id] 
			node = node.next
	console.log swaps
	swaps

swapPairs = (pairs, swap, edgeList) ->
	# Swap pairs
	firsts = []
	seconds = []
	for pair in pairs
		if swap[0] in [pair[0], pair[1]]
			firsts.push pair
		else if swap[1] in [pair[0], pair[1]]
			seconds.push pair

	for first in firsts
		if first[0] == swap[0]
			pos1 = 0
			edge1 = first[1]
		else
			pos1 = 1
			edge1 = first[0]
		for second in seconds
			if second[0] == swap[1]
				pos2 = 0
				edge2 = second[1]
			else
				pos2 = 1
				edge2 = second[0]
			if edgeList[edge1].start == edgeList[edge2].start or edgeList[edge1].start == edgeList[edge2].end or edgeList[edge1].end == edgeList[edge2].start or edgeList[edge1].end == edgeList[edge2].end
				elt = first[pos1]
				first[pos1] = second[pos2]
				second[pos2] = elt
				return pairs

makeGraph = (pairs) ->
	# Make a graph
	g = new graphlib.Graph {directed: false}
	for pair in pairs
		g.setEdge pair[0], pair[1], pair[2]
	return g
	
checkFlatFoldability = (nonBoundVert, pairs) ->

	# Get Connected Components
	g = makeGraph pairs
	edgeNum = g.nodeCount()
	components = graphlib.alg.components g 	# O(V)
	numComp = components.length

	# Check local flat-foldability
	if not checkCycles components, g
		vertList = {}
		for vertIndex, edges of nonBoundVert
			list = makeCycList edges
			head = list.head
			vertList[vertIndex] = head
		
		swaps = findSwaps(vertList)	
		for swap in swaps
			pairs = swapPairs(pairs, swap, edgeList)
			g = makeGraph pairs
			console.log components = graphlib.alg.components g

			if components.length < numComp
				numComp = components.length
				if checkCycles components, g
					return [true, components, g]
			else
				pairs = swapPairs(pairs, swap, edgeList)
			
		console.log "No locally flat-foldable mountain–valley assignment!"
		return [false, null, null]

	return [true, components, g]

CPAssignMV = (edges_assignment, components, g) ->
	for component in components
		assignMV = (node, label) ->
			edges_assignment[node] = if label == 1 then "M" else "V"
			neighbors = g.neighbors node
			for neighbor in neighbors
				if edges_assignment[neighbor] == "U"
					nextLabel = g.edge node, neighbor
					assignMV neighbor, label*nextLabel
		assignMV component[0], 1


################ Main #################		

creasePattern = require "./FlatFoldableTest.json"
yallist = require "yallist"
RBTree = require("bintrees").RBTree
graphlib = require "graphlib"

# Load geometry properities
vertices_coords = creasePattern.vertices_coords
edges_vertices = creasePattern.edges_vertices
edges_assignment = creasePattern.edges_assignment
verticesNum = vertices_coords.length

# Sort data
vertices = getEdge()
nonBoundVert = getNonBoundVert()
nonBoundVert = computeAngle nonBoundVert
# console.log nonBoundVert

# Assign M-V
if kawasakiCheck(nonBoundVert)
	if Object.keys(nonBoundVert).length == 1
		singleVertAssignMV nonBoundVert
		console.log edges_assignment
	else 
		# Make a copy
		[nonBoundVertForCrimp, edgeList] = makeCopy nonBoundVert
		console.log nonBoundVertForCrimp

		pairs = findPairs nonBoundVertForCrimp
		g = makeGraph pairs

		# Check flat-foldability
		[flatFoldable, components, g] = checkFlatFoldability nonBoundVert, pairs, edgeList
		if flatFoldable
			CPAssignMV edges_assignment, components, g
			for edge, i in edges_assignment
				edges_assignment[i] = "M" if edge == "U"
			console.log edges_assignment