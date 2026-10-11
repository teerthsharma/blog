import{B as e,C as t,D as n,E as r,I as i,K as a,L as o,O as s,Q as c,R as l,S as u,U as d,V as f,W as p,X as m,Z as h,_ as g,_t as ee,a as _,bt as v,c as te,ct as ne,et as re,f as y,g as ie,gt as ae,h as oe,it as se,j as ce,k as b,l as le,m as ue,n as x,nt as S,p as de,pt as C,q as fe,s as pe,t as w,u as me,ut as he,vt as T,w as ge,x as _e,xt as ve,y as ye,yt as E,z as be}from"./three.module.DvRed51q.js";var xe=new _,D=new E,O=class extends r{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new _e([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new _e([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new n(t,6,1);return this.setAttribute(`instanceStart`,new b(r,3,0)),this.setAttribute(`instanceEnd`,new b(r,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new n(t,6,1);return this.setAttribute(`instanceColorStart`,new b(r,3,0)),this.setAttribute(`instanceColorEnd`,new b(r,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ve(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),xe.setFromBufferAttribute(t),this.boundingBox.union(xe))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ne),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)D.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(D)),D.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(D));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};x.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new T},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},w.line={uniforms:ee.merge([x.common,x.fog,x.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var k=class extends se{constructor(e){super({type:`LineMaterial`,uniforms:ee.clone(w.line.uniforms),vertexShader:w.line.vertexShader,fragmentShader:w.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},A=new v,Se=new E,Ce=new E,j=new v,M=new v,N=new v,P=new E,we=new be,F=new ce,Te=new E,I=new _,L=new ne,R=new v,z,B;function Ee(e,t,n){return R.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),R.multiplyScalar(1/R.w),R.x=B/n.width,R.y=B/n.height,R.applyMatrix4(e.projectionMatrixInverse),R.multiplyScalar(1/R.w),Math.abs(Math.max(R.x,R.y))}function De(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){F.start.fromBufferAttribute(i,r),F.end.fromBufferAttribute(a,r),F.applyMatrix4(n);let o=new E,s=new E;z.distanceSqToSegment(F.start,F.end,s,o),s.distanceTo(o)<B*.5&&t.push({point:s,pointOnLine:o,distance:z.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function Oe(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,u=Math.min(o.instanceCount,s.count),d=-t.near;z.at(1,N),N.w=1,N.applyMatrix4(t.matrixWorldInverse),N.applyMatrix4(r),N.multiplyScalar(1/N.w),N.x*=i.x/2,N.y*=i.y/2,N.z=0,P.copy(N),we.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=u;t<o;t++){if(j.fromBufferAttribute(s,t),M.fromBufferAttribute(c,t),j.w=1,M.w=1,j.applyMatrix4(we),M.applyMatrix4(we),j.z>d&&M.z>d)continue;if(j.z>d){let e=j.z-M.z,t=(j.z-d)/e;j.lerp(M,t)}else if(M.z>d){let e=M.z-j.z,t=(M.z-d)/e;M.lerp(j,t)}j.applyMatrix4(r),M.applyMatrix4(r),j.multiplyScalar(1/j.w),M.multiplyScalar(1/M.w),j.x*=i.x/2,j.y*=i.y/2,M.x*=i.x/2,M.y*=i.y/2,F.start.copy(j),F.start.z=0,F.end.copy(M),F.end.z=0;let o=F.closestPointToPointParameter(P,!0);F.at(o,Te);let u=l.lerp(j.z,M.z,o),f=u>=-1&&u<=1,p=P.distanceTo(Te)<B*.5;if(f&&p){F.start.fromBufferAttribute(s,t),F.end.fromBufferAttribute(c,t),F.start.applyMatrix4(a),F.end.applyMatrix4(a);let r=new E,i=new E;z.distanceSqToSegment(F.start,F.end,i,r),n.push({point:i,pointOnLine:r,distance:z.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var V=class extends e{constructor(e=new O,t=new k({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,n=0,a=t.count;e<a;e++,n+=2)Se.fromBufferAttribute(t,e),Ce.fromBufferAttribute(r,e),i[n]=n===0?0:i[n-1],i[n+1]=i[n]+Se.distanceTo(Ce);let a=new n(i,2,1);return e.setAttribute(`instanceDistanceStart`,new b(a,1,0)),e.setAttribute(`instanceDistanceEnd`,new b(a,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;z=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;B=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),L.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?B*.5:Ee(r,Math.max(r.near,L.distanceToPoint(z.origin)),s.resolution),L.radius+=c,z.intersectsSphere(L)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),I.copy(o.boundingBox).applyMatrix4(a);let l;l=n?B*.5:Ee(r,Math.max(r.near,I.distanceToPoint(z.origin)),s.resolution),I.expandByScalar(l),z.intersectsBox(I)!==!1&&(n?De(this,t):Oe(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(A),this.material.uniforms.resolution.value.set(A.z,A.w))}},H=class extends O{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setColors(n),this}setFromPoints(e){let t=e.length-1,n=new Float32Array(6*t);for(let r=0;r<t;r++)n[6*r]=e[r].x,n[6*r+1]=e[r].y,n[6*r+2]=e[r].z||0,n[6*r+3]=e[r+1].x,n[6*r+4]=e[r+1].y,n[6*r+5]=e[r+1].z||0;return super.setPositions(n),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},ke=class extends V{constructor(e=new H,t=new k({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}},Ae={type:`change`},U={type:`start`},je={type:`end`},W=new c,Me=new a,Ne=Math.cos(70*l.DEG2RAD),G=new E,K=2*Math.PI,q={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},J=1e-6,Pe=class extends ue{constructor(e,t=null){super(e,t),this.state=q.NONE,this.target=new E,this.cursor=new E,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:o.ROTATE,MIDDLE:o.DOLLY,RIGHT:o.PAN},this.touches={ONE:C.ROTATE,TWO:C.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new E,this._lastQuaternion=new m,this._lastTargetPosition=new E,this._quat=new m().setFromUnitVectors(e.up,new E(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new he,this._sphericalDelta=new he,this._scale=1,this._panOffset=new E,this._rotateStart=new T,this._rotateEnd=new T,this._rotateDelta=new T,this._panStart=new T,this._panEnd=new T,this._panDelta=new T,this._dollyStart=new T,this._dollyEnd=new T,this._dollyDelta=new T,this._dollyDirection=new E,this._mouse=new T,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Ie.bind(this),this._onPointerDown=Fe.bind(this),this._onPointerUp=Le.bind(this),this._onContextMenu=We.bind(this),this._onMouseWheel=Be.bind(this),this._onKeyDown=Ve.bind(this),this._onTouchStart=He.bind(this),this._onTouchMove=Ue.bind(this),this._onMouseDown=Re.bind(this),this._onMouseMove=ze.bind(this),this._interceptControlDown=Ge.bind(this),this._interceptControlUp=Ke.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=q.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Ae),this.update(),this.state=q.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;G.copy(t).sub(this.target),G.applyQuaternion(this._quat),this._spherical.setFromVector3(G),this.autoRotate&&this.state===q.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=K:n>Math.PI&&(n-=K),r<-Math.PI?r+=K:r>Math.PI&&(r-=K),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(G.setFromSpherical(this._spherical),G.applyQuaternion(this._quatInverse),t.copy(this.target).add(G),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=G.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new E(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new E(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=G.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(W.origin.copy(this.object.position),W.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(W.direction))<Ne?this.object.lookAt(this.target):(Me.setFromNormalAndCoplanarPoint(this.object.up,this.target),W.intersectPlane(Me,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>J||8*(1-this._lastQuaternion.dot(this.object.quaternion))>J||this._lastTargetPosition.distanceToSquared(this.target)>J?(this.dispatchEvent(Ae),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?K/60/60*this.autoRotateSpeed:K/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){G.setFromMatrixColumn(t,0),G.multiplyScalar(-e),this._panOffset.add(G)}_panUp(e,t){this.screenSpacePanning===!0?G.setFromMatrixColumn(t,1):(G.setFromMatrixColumn(t,0),G.crossVectors(this.object.up,G)),G.multiplyScalar(e),this._panOffset.add(G)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;G.copy(r).sub(this.target);let i=G.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(K*this._rotateDelta.x/t.clientHeight),this._rotateUp(K*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(K*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-K*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(K*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-K*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(K*this._rotateDelta.x/t.clientHeight),this._rotateUp(K*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new T,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Fe(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Ie(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function Le(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(je),this.state=q.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Re(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case o.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=q.DOLLY;break;case o.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=q.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=q.ROTATE}break;case o.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=q.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=q.PAN}break;default:this.state=q.NONE}this.state!==q.NONE&&this.dispatchEvent(U)}function ze(e){switch(this.state){case q.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case q.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case q.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function Be(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===q.NONE&&(e.preventDefault(),this.dispatchEvent(U),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(je))}function Ve(e){this.enabled!==!1&&this._handleKeyDown(e)}function He(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case C.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=q.TOUCH_ROTATE;break;case C.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=q.TOUCH_PAN;break;default:this.state=q.NONE}break;case 2:switch(this.touches.TWO){case C.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=q.TOUCH_DOLLY_PAN;break;case C.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=q.TOUCH_DOLLY_ROTATE;break;default:this.state=q.NONE}break;default:this.state=q.NONE}this.state!==q.NONE&&this.dispatchEvent(U)}function Ue(e){switch(this._trackPointer(e),this.state){case q.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case q.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case q.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case q.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=q.NONE}}function We(e){this.enabled!==!1&&e.preventDefault()}function Ge(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function Ke(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var Y=e=>e instanceof E?e:new E(e[0],e[1],e[2]),X=e=>e.flatMap(e=>e instanceof E?[e.x,e.y,e.z]:e);function qe(e,n={}){let r=n.intensity??1,i=new u,a=new t(16777215,e.palette.paper.clone().multiplyScalar(.9),1.25*r),o=new g(16777215,1.55*r);o.position.set(4,7,6);let s=new g(16777215,.35*r);s.position.set(-6,2,4);let c=new g(16777215,.7*r);return c.position.set(-2,4,-7),i.add(a,o,s,c),e.scene.add(i),i}function Z(e,t={}){return new d({color:e,roughness:t.roughness??.6,metalness:0,vertexColors:!!t.vertexColors,transparent:t.opacity!=null&&t.opacity<1,opacity:t.opacity??1})}function Je(t,n={}){let r=document.createElement(`canvas`);r.width=r.height=128;let i=r.getContext(`2d`),a=i.createRadialGradient(64,64,0,64,64,64);a.addColorStop(0,`rgba(40,32,20,0.55)`),a.addColorStop(.45,`rgba(40,32,20,0.18)`),a.addColorStop(1,`rgba(40,32,20,0)`),i.fillStyle=a,i.fillRect(0,0,128,128);let o=new le(r),s=n.radius??3,c=new e(new fe(2*s,2*s),new f({map:o,transparent:!0,depthWrite:!1,opacity:n.opacity??.5,toneMapped:!1}));return c.rotation.x=-Math.PI/2,c.position.y=n.y??-2,c.renderOrder=-1,t.scene.add(c),c}function Ye(t,n={}){let r=new e(new te,Z(n.vertexColors?16777215:n.color??5985238,{vertexColors:n.vertexColors,roughness:n.roughness}));return r.userData.tube={radius:n.radius??.08,closed:n.closed??!0,segments:n.segments??Math.max(64,t.length*3),radial:n.radial??14},Xe(r,t),r}function Xe(e,t){let n=e.userData.tube,r=new me(t.map(Y),n.closed,`centripetal`),i=new ae(r,n.segments,n.radius,n.radial,n.closed),a=e.geometry.getAttribute(`color`);a&&i.setAttribute(`color`,a),e.geometry.dispose(),e.geometry=i}function Ze(e,t){let{segments:n,radial:r}=e.userData.tube,i=(n+1)*(r+1),a=e.geometry.getAttribute(`color`);(!a||a.count!==i)&&(a=new pe(new Float32Array(i*3),3),e.geometry.setAttribute(`color`,a));let o=new y;for(let e=0;e<=n;e++){t(e/n,o);for(let t=0;t<=r;t++)a.setXYZ(e*(r+1)+t,o.r,o.g,o.b)}a.needsUpdate=!0}function Qe(e){let t=new k({color:e.vertexColors?16777215:new y(e.color??2039066).getHex(),linewidth:e.width??1.5,worldUnits:!1,dashed:!!e.dashed,dashSize:e.dash??.12,gapSize:e.gap??.08,transparent:(e.opacity??1)<1,opacity:e.opacity??1,vertexColors:!!e.vertexColors,alphaToCoverage:!1});return t.userData.cssWidth=e.width??1.5,t}function $e(e,t={}){let n=new H;n.setPositions(X(e));let r=new ke(n,Qe(t));return t.dashed&&r.computeLineDistances(),r}function et(e,t,n){let r=e.geometry;r.setPositions(X(t)),n&&r.setColors(n.flatMap(e=>[e.r,e.g,e.b])),e.material.dashed&&e.computeLineDistances()}function Q(e,t={}){let n=new O;return n.setPositions(e.flatMap(([e,t])=>[...X([e]),...X([t])])),new V(n,Qe(t))}function tt(e,t={}){let n=new s(new ge(t.radius??.06,t.detail??2),Z(t.color??16777215),e);return n.instanceMatrix.setUsage(ye),n}var $=new be;function nt(e,t,n,r){let i=Math.min(e.count,t.length);for(let a=0;a<i;a++){let i=Y(t[a]),o=r?.[a]??1;$.makeScale(o,o,o).setPosition(i),e.setMatrixAt(a,$),n?.[a]&&e.setColorAt(a,n[a])}e.instanceMatrix.needsUpdate=!0,e.instanceColor&&(e.instanceColor.needsUpdate=!0)}function rt(e,t={}){let n=t.shaft??.018,r=t.head??.06,i=Z(t.color??2039066,{roughness:.5}),a=new s(new oe(n,n,1,8).translate(0,.5,0),i,e),o=new s(new de(r,r*2.6,14).translate(0,-r*1.3,0),i,e),c=new u;c.add(a,o);let l=new E(0,1,0),d=new E,f=new m,p=new E,h=new E,g=new E;return{group:c,set(e,t,n,i){h.copy(Y(t)),g.copy(Y(n)),d.subVectors(g,h);let s=d.length();f.setFromUnitVectors(l,s>1e-9?d.clone().divideScalar(s):l);let c=Math.min(s,r*2.6);p.set(1,Math.max(1e-6,s-c),1),a.setMatrixAt(e,$.compose(h,f,p));let u=s>1e-9?1:1e-6;o.setMatrixAt(e,$.compose(g,f,p.set(u,u,u))),i&&(a.setColorAt(e,i),o.setColorAt(e,i))},commit(){a.instanceMatrix.needsUpdate=o.instanceMatrix.needsUpdate=!0,a.instanceColor&&(a.instanceColor.needsUpdate=!0),o.instanceColor&&(o.instanceColor.needsUpdate=!0)}}}function it(t){let n=new Uint8Array(t.nx*t.ny*4),r=new ie(n,t.nx,t.ny,h);r.colorSpace=S,r.magFilter=r.minFilter=t.smooth===!1?p:i;let a=new fe(t.x[1]-t.x[0],t.y[1]-t.y[0]),o=new e(a,new f({map:r,toneMapped:!1}));o.position.set((t.x[0]+t.x[1])/2,(t.y[0]+t.y[1])/2,0);let s=new y,c=t.domain??[0,1];return{mesh:o,get domain(){return c},set(e,i){i&&(c=i);let[a,o]=c;for(let r=0;r<t.nx*t.ny;r++){let i=e[r];if(t.map===`div`){let e=Math.max(Math.abs(a),Math.abs(o))||1;t.ctx.palette.div(i/e,s)}else t.ctx.palette.seq((i-a)/(o-a||1),s);s.convertLinearToSRGB(),n[4*r]=s.r*255,n[4*r+1]=s.g*255,n[4*r+2]=s.b*255,n[4*r+3]=255}r.needsUpdate=!0}}}function at(e,t){let n=document.createElement(`div`);n.className=`lbl scalebar`;let r=t.format??(e=>Math.abs(e)>=100?e.toFixed(0):e.toFixed(2));n.innerHTML=`<span class="scalebar__label"></span><span class="scalebar__ramp"></span><span class="scalebar__ticks"><span></span><span></span><span></span></span>`,n.querySelector(`.scalebar__ramp`).style.background=t.map===`div`?e.palette.divCss:e.palette.seqCss,n.style.width=`${t.width??140}px`,e.overlay.el.appendChild(n);let i=()=>{let[r,i]=t.px??[e.size.w-(t.width??140)-16,14];n.style.transform=`translate(${r}px, ${i}px)`},a=e=>{n.querySelector(`.scalebar__label`).textContent=t.label;let i=n.querySelectorAll(`.scalebar__ticks span`),a=t.map===`div`?0:(e[0]+e[1])/2;[e[0],a,e[1]].forEach((e,t)=>i[t].textContent=r(e))};return a(t.domain),i(),{el:n,set:a,place:i}}function ot(e,t){let n=e.palette,r=t.format??(e=>String(+e.toFixed(2))),[i,a]=t.x,[o,s]=t.y,c=new u,l=(s-o)*.018,d=(a-i)*.012,f=t.xTicks??[],p=t.yTicks??[];return t.grid&&c.add(Q([...f.map(e=>[[e,o,-.01],[e,s,-.01]]),...p.map(e=>[[i,e,-.01],[a,e,-.01]])],{color:n.line,width:1})),c.add(Q([[[i,o,0],[a,o,0]],[[i,o,0],[i,s,0]],...f.map(e=>[[e,o,0],[e,o-l,0]]),...p.map(e=>[[i,e,0],[i-d,e,0]])],{color:n.line2,width:1.25})),t.zeroLine&&o<0&&s>0&&c.add(Q([[[i,0,0],[a,0,0]]],{color:n.ink3,width:1,dashed:!0,dash:(a-i)/120,gap:(a-i)/160})),e.scene.add(c),f.forEach(t=>e.overlay.label(r(t),{at:[t,o,0],valign:`top`,offset:[0,7],cls:`mono tick`})),p.forEach(t=>e.overlay.label(r(t),{at:[i,t,0],align:`right`,offset:[-8,0],cls:`mono tick`})),t.xLabel&&e.overlay.label(t.xLabel,{at:[(i+a)/2,o,0],valign:`top`,offset:[0,26],cls:`axis`}),t.yLabel&&e.overlay.label(t.yLabel,{at:[i,s,0],align:`left`,valign:`bottom`,offset:[-4,-10],cls:`axis`}),c}function st(e,t,n={}){let r=e.el.querySelector(`.stage__canvas`),i=new Pe(t,r);i.target.set(...n.target??[0,0,0]),i.enableDamping=!0,i.dampingFactor=.08,i.rotateSpeed=.6,i.enablePan=!1,i.enableZoom=!!n.zoom;let a=t.position.distanceTo(i.target);return i.minDistance=n.minDistance??a*.7,i.maxDistance=n.maxDistance??a*1.4,[i.minPolarAngle,i.maxPolarAngle]=n.polar??[.15,Math.PI-.15],i.autoRotateSpeed=n.autoRotate??.5,i.update(),r.style.touchAction=`pan-y`,r.style.cursor=`grab`,i.addEventListener(`start`,()=>r.style.cursor=`grabbing`),i.addEventListener(`end`,()=>r.style.cursor=`grab`),e.tick(t=>(i.autoRotate=!e.reducedMotion&&e.clock.playing&&(n.autoRotate??.5)!==0,i.update(t>0?t/1e3:null))),e.onDispose(()=>i.dispose()),i}function ct(e,t={}){let n=e.palette.role[t.role??`refused`],r=document.createElement(`canvas`);r.width=r.height=32;let i=r.getContext(`2d`);i.fillStyle=`#${n.wash.getHexString(S)}`,i.fillRect(0,0,32,32),i.strokeStyle=`#${n.mark.getHexString(S)}`,i.lineWidth=2;for(let e=-32;e<=64;e+=8)i.beginPath(),i.moveTo(e,32),i.lineTo(e+32,0),i.stroke();let a=new le(r);return a.colorSpace=S,a.wrapS=a.wrapT=re,a.repeat.set(t.repeat??4,t.repeat??4),a.anisotropy=4,new f({map:a,toneMapped:!1,transparent:(t.opacity??1)<1,opacity:t.opacity??1})}export{O as S,Ye as _,$e as a,V as b,Z as c,at as d,Q as f,qe as g,tt as h,Je as i,st as l,Xe as m,ot as n,ct as o,et as p,Ze as r,it as s,rt as t,nt as u,Pe as v,k as x,H as y};