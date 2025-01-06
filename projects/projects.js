const { mat4 } = glMatrix;
const { vec3 } = glMatrix;

window.onload = function solsys_main() {

//initialize WebGL
const canvas = document.getElementById('solsys-canvas');
const gl = canvas.getContext('webgl2');
//end of WebGL initialization

//data for our solar system objects

    //base object
    function icosphere (p)
    {
        //icosahedron
        //first 12 vertices
        var verts = [];

        const gr = (1.0 + Math.sqrt(5.0))/2.0; //golden ratio

        verts.push(-1.0, gr, 0.0);  //0
        verts.push(1.0, gr, 0.0);   //1
        verts.push(-1.0, -gr, 0.0); //2
        verts.push(1.0, -gr, 0.0);  //3

        verts.push(0.0, -1.0, gr);  //4
        verts.push(0.0, 1.0, gr);   //5
        verts.push(0.0, -1.0, -gr); //6
        verts.push(0.0, 1.0, -gr);  //7

        verts.push(gr, 0.0, -1.0);  //8
        verts.push(gr, 0.0, 1.0);   //9
        verts.push(-gr, 0.0, -1.0); //10
        verts.push(-gr, 0.0, 1.0);  //11

        var colours = [
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
            1.0, 0.0, 0.0,

            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, 0.0, 1.0,
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
        ];
        //end of first 12 vertices

        //faces of icosa
        var faces = [
            0, 11, 5,
            0, 5, 1,
            0, 1, 7,
            0, 7, 10,
            0, 10, 11,

            1, 5, 9,
            5, 11, 4,
            11, 10, 2,
            10, 7, 6,
            7, 1, 8,

            3, 9, 4,
            3, 4, 2,
            3, 2, 6,
            3, 6, 8,
            3, 8, 9,

            4, 9, 5,
            2, 4, 11,
            6, 2, 10,
            8, 6, 7,
            9, 8, 1
        ];
        //end of faces of icosa

        //end of icosahedron

        //spherification
        //code taken from https://observablehq.com/@mourner/fast-icosphere-mesh with minor modifications 
        var v = 12;
        const midCache = 3 ? new Map() : null; // midpoint vertices cache to avoid duplicating shared vertices

        function addMidPoint(a, b) {
            const key = Math.floor((a + b) * (a + b + 1) / 2) + Math.min(a, b); // Cantor's pairing function
            let i = midCache.get(key);
            if (i !== undefined)
            {
                midCache.delete(key); return i;
            }
            midCache.set(key, v);
            for (let k = 0; k < 3; k++)
            {
                verts[3 * v + k] = (verts[3 * a + k] + verts[3 * b + k]) / 2;
            }
            i = v++;
            return i;
        }

        let facesPrev = faces;
        for (let i = 0; i < 3; i++)
        {
            // subdivide each triangle into 4 triangles
            faces = new Uint32Array(facesPrev.length * 4);
            for (let k = 0; k < facesPrev.length; k += 3)
            {
                const v1 = facesPrev[k + 0];
                const v2 = facesPrev[k + 1];
                const v3 = facesPrev[k + 2];
                const a = addMidPoint(v1, v2);
                const b = addMidPoint(v2, v3);
                const c = addMidPoint(v3, v1);
                let t = k * 4;
                faces[t++] = v1; faces[t++] = a; faces[t++] = c;
                faces[t++] = v2; faces[t++] = b; faces[t++] = a;
                faces[t++] = v3; faces[t++] = c; faces[t++] = b;
                faces[t++] = a;  faces[t++] = b; faces[t++] = c;
            }
        facesPrev = faces;
        }
        for (let j = 11; j < faces.length; j += 72)
        {
            colours.push(1.0, 0.0, 0.0);
            colours.push(0.0, 1.0, 0.0);
            colours.push(0.0, 0.0, 1.0);
            colours.push(1.0, 0.0, 0.0);

            colours.push(0.0, 1.0, 0.0);
            colours.push(0.0, 0.0, 1.0);
            colours.push(1.0, 0.0, 0.0);
            colours.push(0.0, 1.0, 0.0);

            colours.push(0.0, 0.0, 1.0);
            colours.push(1.0, 0.0, 0.0);
            colours.push(0.0, 1.0, 0.0);
            colours.push(0.0, 0.0, 1.0);
        }

        // normalize vertices
        for (let i = 0; i < verts.length; i += 3)
        {
            const m = 1 / Math.hypot(verts[i + 0], verts[i + 1], verts[i + 2]);
            verts[i + 0] *= m;
            verts[i + 1] *= m;
            verts[i + 2] *= m;
        }
        //end of spherification

        //uv mapping
        //code taken from https://github.com/mourner/icomesh/blob/ff2000d5263e8364c47c2d4028da4483c9c11d88/index.js with minor modifications
        const uv = new Float32Array(1350);
        for (let i = 0; i < 642; i++) {
            uv[2 * i + 0] = Math.atan2(verts[3 * i + 2], verts[3 * i]) / (2 * Math.PI) + 0.5;
            uv[2 * i + 1] = Math.asin(verts[3 * i + 1]) / Math.PI + 0.5;
        }

        const duplicates = new Map();

        function addDuplicate(i, uvx, uvy, cached) {
            if (cached) {
                const dupe = duplicates.get(i);
                if (dupe !== undefined)
                    return dupe;
            }
            verts[3 * v + 0] = verts[3 * i + 0];
            verts[3 * v + 1] = verts[3 * i + 1];
            verts[3 * v + 2] = verts[3 * i + 2];
            uv[2 * v + 0] = uvx;
            uv[2 * v + 1] = uvy;
            if (cached) duplicates.set(i, v);
            return v++;
        }

        for (let i = 0; i < faces.length; i += 3) {
            const a = faces[i + 0];
            const b = faces[i + 1];
            const c = faces[i + 2];
            let ax = uv[2 * a];
            let bx = uv[2 * b];
            let cx = uv[2 * c];
            const ay = uv[2 * a + 1];
            const by = uv[2 * b + 1];
            const cy = uv[2 * c + 1];

            // uv fixing code; don't ask me how I got here
            if (bx - ax >= 0.5 && ay !== 1) bx -= 1;
            if (cx - bx > 0.5) cx -= 1;
            if (ax > 0.5 && ax - cx > 0.5 || ax === 1 && cy === 0) ax -= 1;
            if (bx > 0.5 && bx - ax > 0.5) bx -= 1;

            if (ay === 0 || ay === 1) {
                ax = (bx + cx) / 2;
                if (ay === bx)
                    uv[2 * a] = ax;
                else faces[i + 0] = addDuplicate(a, ax, ay, false);

            } else if (by === 0 || by === 1) {
                bx = (ax + cx) / 2;
                if (by === ax)
                    uv[2 * b] = bx;
                else faces[i + 1] = addDuplicate(b, bx, by, false);

            } else if (cy === 0 || cy === 1) {
                cx = (ax + bx) / 2;
                if (cy === ax) uv[2 * c] = cx;
                else faces[i + 2] = addDuplicate(c, cx, cy, false);
            }
            if (ax !== uv[2 * a] && ay !== 0 && ay !== 1) faces[i + 0] = addDuplicate(a, ax, ay, true);
            if (bx !== uv[2 * b] && by !== 0 && by !== 1) faces[i + 1] = addDuplicate(b, bx, by, true);
            if (cx !== uv[2 * c] && cy !== 0 && cy !== 1) faces[i + 2] = addDuplicate(c, cx, cy, true);
        }
        //end of uv mapping

        if (p == 'v')
        {
            return verts;
        }
        else if (p == 'i')
        {
            return faces;
        }
        else if (p == 'c')
        {
            return colours;
        }
        else if (p == 't')
        {
            return uv;
        }
    }

    var baseObjVertexData = icosphere('v');
    const baseObjVertexData_F32 = new Float32Array(baseObjVertexData);

    console.log(baseObjVertexData_F32);

    var baseObjIndexData = icosphere('i');
    const baseObjIndexData_I16 = new Uint16Array(baseObjIndexData);

    var baseObjColourData = icosphere('c');
    const baseObjColourData_F32 = new Float32Array(baseObjColourData);

    var baseObjTextureData = icosphere('t');
    const baseObjTextureData_F32 = new Float32Array(baseObjTextureData);

    //end of base object

//end of solar system object data

//buffer creation and binding
    //buffer creator function
    function createStaticVertexBuffer(gl, data)
    {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return buffer;
    }
    //end of buffer creator function

    const baseObjVertexBuffer = createStaticVertexBuffer(gl, baseObjVertexData_F32);

    const baseObjIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, baseObjIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, baseObjIndexData_I16, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    const baseObjColourBuffer = createStaticVertexBuffer(gl, baseObjColourData_F32);

    const baseObjTextureBuffer = createStaticVertexBuffer(gl, baseObjTextureData_F32);
//end of buffer creation and binding

//shaders
    //vertex shader
    const vertexShader1SourceCode = `#version 300 es
    precision mediump float;

    in vec3 vertexPosition;
    in vec3 vertexColour;
    in vec2 vertexTexCoord;

    out vec3 fragColour;
    out vec2 fragTexCoord;
    out vec3 surfaceNormal;

    uniform mat4 worldTransformer;
    uniform mat4 viewTransformer;
    uniform mat4 projTransformer;
    uniform vec3 canvasSize;
    uniform vec3 objLocation;
    uniform float objSize;

    void main ()
    {
        vec3 finalVertexPosition = vertexPosition * objSize + objLocation;
        vec3 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

        gl_Position = projTransformer * viewTransformer * worldTransformer * vec4(clipPosition, 1.0);
        fragColour = vertexColour;
        fragTexCoord = vertexTexCoord;
        surfaceNormal = mat3(viewTransformer * worldTransformer) * (vertexPosition);
        gl_PointSize = 3.0;
    }`;

    const vertexShader1 = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader1, vertexShader1SourceCode);
    gl.compileShader(vertexShader1);
    if (!gl.getShaderParameter(vertexShader1, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(vertexShader1));
        gl.deleteShader(vertexShader1);
    }
    //end of vertex shader

    //fragment shader
    const fragmentShader1SourceCode = `#version 300 es
    precision mediump float;

    in vec3 fragColour;
    in vec2 fragTexCoord;
    in vec3 surfaceNormal;

    uniform vec3 uAmbientLight;
    uniform vec3 uDirectionalLight;
    uniform sampler2D sampler;

    out vec4 outputColour;

    void main ()
    {
        vec3 lightDirection = normalize(uDirectionalLight);
        float diffuseFactor = max(dot(surfaceNormal, lightDirection), 0.0); // Lambertian diffuse

        vec3 diffuseColor = vec3(1.5, 1.5, 1.5);
        vec3 finalColor = diffuseColor * diffuseFactor;

        outputColour = (texture(sampler, fragTexCoord)) * vec4(uAmbientLight + finalColor, 1.0);
    }`;
    
    const fragmentShader1 = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader1, fragmentShader1SourceCode);
    gl.compileShader(fragmentShader1);
    if (!gl.getShaderParameter(fragmentShader1, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(fragmentShader1));
        gl.deleteShader(fragmentShader1);
    }
    //end of fragment shader
    
    //webgl shader program
    const shaderProgram1 = gl.createProgram();
    gl.attachShader(shaderProgram1, vertexShader1);
    gl.attachShader(shaderProgram1, fragmentShader1);
    gl.linkProgram(shaderProgram1);
    if (!gl.getProgramParameter(shaderProgram1, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram1));
    }

    const vertexPositionAttrLocation = gl.getAttribLocation(shaderProgram1, 'vertexPosition');
    const vertexColourAttrLocation = gl.getAttribLocation(shaderProgram1, 'vertexColour');
    const vertexTextureAttrLocation = gl.getAttribLocation(shaderProgram1, 'vertexTexCoord');
    const worldTransMatrixUniLocation = gl.getUniformLocation(shaderProgram1, 'worldTransformer');
    const viewTransMatrixUniLocation = gl.getUniformLocation(shaderProgram1, 'viewTransformer');
    const projTransMatrixUniLocation = gl.getUniformLocation(shaderProgram1, 'projTransformer');
    const canvasSizeUni = gl.getUniformLocation(shaderProgram1, 'canvasSize');
    const objLocationUni = gl.getUniformLocation(shaderProgram1, 'objLocation');
    const objSizeUni = gl.getUniformLocation(shaderProgram1, 'objSize');
    const AmbientLightUni = gl.getUniformLocation(shaderProgram1, 'uAmbientLight');
    const DirectionalLightUni = gl.getUniformLocation(shaderProgram1, 'uDirectionalLight');
    //end of webgl program
//end of shaders

//output merger

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //identity matrix
    var identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    //end of identity matrix

    //some world setting stuff
    var worldMatrix = new Float32Array(16);
    mat4.identity(worldMatrix);
    //end of world setting stuff

    //some viewing stuff
    var sunAng = 0;
    var mercuryAng = 0;
    var venusAng = 0;
    var earthAng = 0;
    var moonAng = 0;
    var marsAng = 0;
    var jupiterAng = 0;
    var saturnAng = 0;
    var uranusAng = 0;
    var neptuneAng = 0;

    var eye = new Float32Array(3);
    var centre = new Float32Array(3);
    var up = new Float32Array(3);
    vec3.set(eye, 0.0, 0.0, 3.0);
    vec3.set(centre, 0.0, 0.0, 0.0);
    vec3.set(up, 0.0, 1.0, 0.0);


    var viewMatrix = new Float32Array(16);
    mat4.lookAt(viewMatrix, eye, centre, up);
    //end of viewing stuff

    //some projecting stuff
    var a = -45;
    var radians = glMatrix.glMatrix.toRadian(a);
    var aRatio = canvas.width / canvas.height;
    var near = 0.1;
    var far = 1000.0;

    var projMatrix = new Float32Array(16);
    mat4.perspective(projMatrix, radians, aRatio, near, far);
    //end of projecting stuff

//end of output merger

//rasterizer setup
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.viewport(0, 0, canvas.width, canvas.height);
//end of rasterizer setup

//gpu setup
    gl.useProgram(shaderProgram1);
    gl.enableVertexAttribArray(vertexPositionAttrLocation);
    gl.enableVertexAttribArray(vertexColourAttrLocation);
    gl.enableVertexAttribArray(vertexTextureAttrLocation);

    //create textures
    //texture creator function
    function createObjectTexture(gl, data)
    {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById(data));

        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return texture;
    }
    //end of texture creator function

    var earthTexture = createObjectTexture(gl, 'earthIMG');

    //end of texture creation
//end of gpu setup

//input assemembly
    gl.bindBuffer(gl.ARRAY_BUFFER, baseObjVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, baseObjIndexBuffer);
    gl.vertexAttribPointer(vertexPositionAttrLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, baseObjColourBuffer);
    gl.vertexAttribPointer(vertexColourAttrLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, baseObjTextureBuffer);
    gl.vertexAttribPointer(vertexTextureAttrLocation, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.uniformMatrix4fv(worldTransMatrixUniLocation, false, worldMatrix);
    gl.uniformMatrix4fv(viewTransMatrixUniLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projTransMatrixUniLocation, false, projMatrix);
    gl.uniform3f(canvasSizeUni, 0.5625 * canvas.width, canvas.height, 0.5625 * canvas.width);
//end of input assembly

//draw


    var bigM = 0.3;
    var AmbientLight = new Float32Array(3);
    var LightDirection = new Float32Array(3);
    vec3.set(AmbientLight, 0.0, 0.0, 0.0);
    vec3.set(LightDirection, 0, 0, 1);

    //render function
    function render()
    {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        sunAng = performance.now() / 1000 / 30 * 2 * Math.PI;
        mat4.translate(worldMatrix, worldMatrix, [0,0,0])
        mat4.rotate(worldMatrix, identityMatrix, -bigM*sunAng/(25.0/365.0), [0, 1, 0]);
        mat4.translate(worldMatrix, worldMatrix, [0,0,0])
        gl.uniformMatrix4fv(worldTransMatrixUniLocation, false, worldMatrix);
        gl.uniform3fv(AmbientLightUni, AmbientLight);
        gl.uniform3fv(DirectionalLightUni, LightDirection);
        gl.bindTexture(gl.TEXTURE_2D, earthTexture);
        gl.uniform1f(objSizeUni, canvas.height/3);
        gl.uniform3f(objLocationUni, canvas.height/2, canvas.height/2, canvas.height/2);
        gl.drawElements(gl.TRIANGLES, baseObjIndexData_I16.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform3fv(AmbientLightUni, AmbientLight);

        requestAnimationFrame(render);
    }
    //end of render function

    requestAnimationFrame(render);
//end of draw

}

try {
    solsys_main();
} catch (e) {
    
}