/* Copyright (c) 2009-2010 King Abdullah University of Science and Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** 
 * This class encapsulates the box primitive.  It is mostly
 * meant for use with isosurface rendering to give the user
 * an impression of the orientation of an object.
 *
 * @param {int} options just a place-holder for future changes
 * @constructor
 * @requires primitive Inherits from primitive
 * @requires screen    Has a reference to a screen object
 */
function box(options, source) {
	
	/** The WebGL context we'll be using */
	this.gl         = null;
	/** The VBO that stores the vertices */
	this.vertexVBO	= null;
	/** The VBO that stores the indices of the vertices */
	this.indexVBO	= null;
	/** The count of indices in indexVBO */
	this.index_ct   = 0;
	
	/**
	 * This function is called by the grapher class so that the box
	 * has access to relevant information, but it is only initialized
	 * when grapher deems appropriates
	 *
	 * @param {WebGLContext} gl   a WebGL context, provided by grapher
	 * @param {screen}       scr  a reference to the screen object, provided by grapher
	 *
	 * @see grapher
	 */
	this.initialize = function(gl, scr) {
		this.gl = gl;
		this.refresh(scr);
		this.gen_program();
	}
	
	/**
	 * Refresh is a way for the grapher instance to notify surface
	 * of changes to the viewing environment.  This just updates the VBO
	 * to draw a box around the whole screen
	 *
	 * This method is meant to only be called by the grapher class.
	 *
	 * @param {screen} scr required for information about the viewable screen
	 */
	this.refresh = function(scr) {
		this.gen_vbo(scr);
	}

	/**
	 * All primitives are responsible for knowing how to construct
	 * themselves and so this is the function that constructs the VBO for
	 * the objects.
	 *
	 * This method is meant to be private
	 *
	 * @param {screen} scr is information about the viewable screen
	 */
	this.gen_vbo = function(scr) {
		// Victory! It works!
		var vertices = [ scr.maxx, scr.maxy,  scr.minx,  //A 0
										 scr.minx, scr.miny, -scr.minx,  //B 1
										 scr.maxx, scr.miny,  scr.minx,  //C 2
										 scr.maxx, scr.miny, -scr.minx,  //D 3
										 scr.maxx, scr.maxy, -scr.minx,  //E 4
										 scr.minx, scr.miny,  scr.minx,  //F 5
										 scr.minx, scr.maxy,  scr.minx,  //G 6
										 scr.minx, scr.maxy, -scr.minx]; //H 7
		var indices  = [ 0, 2, 0, 4, 0, 6, 6, 7, 6, 5, 5, 1, 5, 2, 2, 3, 3, 4, 3, 1, 1, 7, 7, 4];

		if (this.vertexVBO) {
			this.gl.deleteBuffer(this.vertexVBO);
		}
		
		this.vertexVBO = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexVBO);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new WebGLFloatArray(vertices), this.gl.STATIC_DRAW);
		
		if (this.indexVBO) {
			this.gl.deleteBuffer(this.indexVBO);
		}
		
		this.indexVBO = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new WebGLUnsignedShortArray(indices), this.gl.STATIC_DRAW);
		
		this.index_ct = indices.length;
	}
	
	/**
	 * Every primitive is also responsible for knowing how to draw
	 * itself, and that behavior is encapsulated in this function. It should
	 * be completely self-contained, returning the context state to what it
	 * was before it's called.
	 *
	 * This method can be called at any time after initialization to draw
	 * the box to the screen.  Though, it is meant to be primarily called by
	 * grapher.
	 *
	 * @param {screen} scr the current screen
	 */
	this.draw = function(scr) {
		scr.perspective();
		this.setUniforms(scr);
		this.gl.enableVertexAttribArray(0);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexVBO);
		this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
		
		this.gl.drawElements(this.gl.LINES, this.index_ct, this.gl.UNSIGNED_SHORT, 0);
		
		this.gl.disableVertexAttribArray(0);
	}
	
	/**
	 * Any class who inherits from the primitive class gets free
	 * access to shader compilation and program linking, but only must 
	 * provide the fragment and vertex shader sources.  The primitive class
	 * also provides free access to functionality for reading files.
	 * 
	 * This function generates its program, and stores it back in
	 * this.program (this is done impliciatly through the call to
	 * primitive.compile_program).
	 */
	this.gen_program = function() {
		var vertex_source = this.read("shaders/passthru.vert");
		var frag_source		= this.read("shaders/passthru.frag");
		
		vertex_source = vertex_source.replace("/* CYLINDRICAL", "//* Cylindrical")
		
		this.compile_program(vertex_source, frag_source);		
	}
}

box.prototype = new primitive();