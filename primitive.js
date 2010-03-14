CARTESIAN   = 0;
CYLINDRICAL = 1;
SPHERICAL   = 2;

/* This is a parent class for all primitives.  Inheriting from
 * it is not strictly necessary (as this is JavaScript), but it
 * provides access to some very valuable functions.
 *
 * For example, it encapsulates reading of filenames, and shader
 * program compilation and linking
 */
function primitive(context) {
	
	this.program = null;
	
	/* Encapsulates reading a file, usually for shader source inc-
	 * lusion. There may be a faster and/or more robust way of doing
	 * this, but the encapsulation makes for easy changes.
	 */
	this.read = function(filename) {
		var request = new XMLHttpRequest();
		
		request.open("GET", filename, false);
		request.send();
		return request.responseText;
	}
	
	/* Compile AND link the shader program
	 *
	 * Give it vertex source and shader source, and it will populate
	 * this.program with a shader program.  It prints out errors to 
	 * the console, which can prove extremely helpful.
	 */
	this.compile_program = function(vertex_source, frag_source) {
		// Add user parameters
		if (this.parameters) {
			console.log("Adding parameters to shader source");
			var params = "// User parameters\n";
			for (i in this.parameters) {
				params += "uniform float " + i + ";\n";
			}
			
			vertex_source = vertex_source.replace("// USER_PARAMETERS", params);
			frag_source   = frag_source.replace(  "// USER_PARAMETERS", params);
		}
		
		/*
		this.gl.console.log("Vertex shader:\n" + vertex_source);
		this.gl.console.log("Fragment shader:\n" + frag_source);
		*/
		
		var vertex_shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		var frag_shader		= this.gl.createShader(this.gl.FRAGMENT_SHADER);
		
		this.gl.shaderSource(vertex_shader, vertex_source);
		this.gl.shaderSource(	 frag_shader, frag_source);

		this.gl.compileShader(vertex_shader);
		this.gl.compileShader(frag_shader);
		
		/* You can handle the compile status with the code provided by 
		 * Khronos or every WebGL demo anywhere.  In fact, that's where
		 * this code came from.
		 */
		var compiled = this.gl.getShaderParameter(vertex_shader, this.gl.COMPILE_STATUS);
		if (!compiled) {
				// Something went wrong during compilation; get the error
				var error = this.gl.getShaderInfoLog(vertex_shader);
				this.gl.console.log(vertex_source);
				this.gl.console.log("Error in compiling vertex shader: " + error);
				return null;
		}
		
		compiled = this.gl.getShaderParameter(frag_shader, this.gl.COMPILE_STATUS);
		if (!compiled) {
				// Something went wrong during compilation; get the error
				var error = this.gl.getShaderInfoLog(frag_shader);
				this.gl.console.log(frag_source);
				this.gl.console.log("Error in compiling fragment shader: " + error);
				return null;
		}

		// Create the program object
		this.program = this.gl.createProgram();

		// Attach our two shaders to the program
		this.gl.attachShader(this.program, vertex_shader);
		this.gl.attachShader(this.program, frag_shader);

		// Link the program
		this.gl.linkProgram(this.program);

		/* You can check link status with this code, found at Khronos
		 * and every WebGL demo everywhere
		 */
		var linked = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
		if (!linked) {
				// something went wrong with the link
				var error = this.gl.getProgramInfoLog (this.program);
				this.gl.console.log("Error in program linking:"+error);
				/* It's probably a best practice to delete the compiled
				 * shaders in this case.  You should implement that.
				 */
				this.gl.deleteShader(frag_shader);
				this.gl.deleteShader(vert_shader);
				this.gl.deleteProgram(this.program);
				this.program = null;
				
				return null;
		}
		return this.program;
	}
	
	this.checkFramebuffer = function() {
		var gl = this.gl;
		var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

		if (status == gl.FRAMEBUFFER_COMPLETE) {
			gl.console.log("Framebuffer complete");
		} else if (status == gl.FRAMEBUFFER_UNSUPPORTED) {
			gl.console.log("Framebuffer unsupported");
		} else if (status == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
			gl.console.log("Incomplete attachment");
		} else if (status == gl.FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER) {
			gl.console.log("Incomplete draw buffer");
		} else if (status == gl.FRAMEBUFFER_INCOMPLETE_READ_BUFFER) {
			gl.console.log("Incomplete read buffer");
		} else if (status == gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
			gl.console.log("Incomplete multisample");
		} else if (status == gl.FRAMEBUFFER_UNDEFINED) {
			gl.console.log("Framebuffer undefined");
		} else if (status == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
			gl.console.log("Incomplete missing attachment");
		} else {
			gl.console.log("Uncertain failure.");
		}
		
		return status;
	}
	
	this.setUniforms = function(scr, program) {
		try {
			program = program || this.program;
		
			this.gl.useProgram(program);
		
			modelview_location  = this.gl.getUniformLocation(program, "u_modelViewMatrix");
			projection_location = this.gl.getUniformLocation(program, "u_projectionMatrix");
			time_location	      = this.gl.getUniformLocation(program, "t");
			dx_location         = this.gl.getUniformLocation(program, "dx");
			dy_location         = this.gl.getUniformLocation(program, "dy");
			scale_location      = this.gl.getUniformLocation(program, "scale");
			color_location      = this.gl.getUniformLocation(program, "color");

			this.gl.uniformMatrix4fv(modelview_location , false, scr.modelview.getAsWebGLFloatArray());
			this.gl.uniformMatrix4fv(projection_location, false, scr.projection.getAsWebGLFloatArray());
			this.gl.uniform1f(time_location, scr.wall.time());

			if (this.color) {
				this.gl.uniform4f(color_location, this.color[0], this.color[1], this.color[2], this.color[3]);
			}
			
			/*
			this.gl.uniform1f(time_location , scr.time);
			this.gl.uniform1f(dx_location   , scr.dx);
			this.gl.uniform1f(dy_location   , scr.dy);
			this.gl.uniform1f(scale_location, scr.s);
			*/
		
			for (var j in this.parameters) {
				param_loc = this.gl.getUniformLocation(program, j);
				this.gl.uniform1f(param_loc, this.parameters[j]);
			}
		} catch (e) {
			this.gl.console.log("setUniforms is breaking : " + e);
		}
	}
}