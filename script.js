(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector(".motion-control");
  const controls = document.querySelector(".track-controls");
  const stage = document.querySelector(".hero-art");
  const description = document.querySelector("#track-description");
  const caseLink = document.querySelector("#track-case-link");
  const tracks = {
    product: {
      description:
        "Del pedido a las APIs y la operación: portales, administración y flujos de producto.",
      href: "#personal-studio",
      label: "Ver Personal Design Studio",
    },
    ops: {
      description:
        "Del código al servicio: entornos, entrega y recuperación de procesos.",
      href: "#automatizaciones",
      label: "Ver automatizaciones y agentes",
    },
    ai: {
      description:
        "Del registro visual a un resultado revisable: análisis con Gemini y evidencia.",
      href: "#cc-vision",
      label: "Ver CC Vision",
    },
  };
  let userPaused = false;
  let motionEnabled = false;
  let animationContext = null;
  let pointerCleanups = [];
  let sculpture = null;

  // The sculpture has its own small mesh renderer. All shapes and lighting are original.
  function createSculpture(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;
    const small = window.matchMedia("(max-width: 600px)").matches;
    const segments = small ? 72 : 100;
    const sides = small ? 12 : 16;
    const normalize = (vector) => {
      const length = Math.hypot(...vector) || 1;
      return vector.map((value) => value / length);
    };
    const cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    const subtract = (a, b) => a.map((value, i) => value - b[i]);
    function geometry(p, q, radius, wave, depth, tube) {
      const center = (t) => [
        (radius + wave * Math.cos(q * t)) * Math.cos(p * t),
        (radius + wave * Math.cos(q * t)) * Math.sin(p * t),
        depth * Math.sin(q * t),
      ];
      const vertices = [];
      for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const c = center(t);
        const tangent = normalize(subtract(center(t + 0.001), c));
        const normal = normalize(cross(tangent, [0, 0, 1]));
        const binormal = normalize(cross(tangent, normal));
        for (let j = 0; j < sides; j++) {
          const v = (j / sides) * Math.PI * 2;
          vertices.push(
            c.map(
              (value, k) =>
                value +
                tube * (Math.cos(v) * normal[k] + Math.sin(v) * binormal[k]),
            ),
          );
        }
      }
      return vertices;
    }
    const shapes = {
      product: geometry(2, 3, 1.7, 0.58, 0.82, 0.39),
      ops: geometry(1, 0, 1.95, 0, 0, 0.72),
      ai: geometry(3, 2, 1.65, 0.65, 0.95, 0.22),
    };
    const vertices = shapes.product.map((point) => [...point]);
    const faces = [];
    for (let i = 0; i < segments; i++)
      for (let j = 0; j < sides; j++) {
        faces.push([
          i * sides + j,
          ((i + 1) % segments) * sides + j,
          ((i + 1) % segments) * sides + ((j + 1) % sides),
          i * sides + ((j + 1) % sides),
        ]);
      }
    let target = shapes.product;
    let width = 600,
      height = 600,
      rotation = 0.55;
    let running = false,
      visible = true,
      raf = 0,
      lastTime = 0;
    let pointerX = 0,
      pointerY = 0,
      currentX = 0,
      currentY = 0;
    const light = normalize([-0.45, -0.65, 1]);
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.145;
      const rx = -0.55 + currentY * 0.24,
        ry = rotation + currentX * 0.32,
        rz = -0.32;
      const cx = Math.cos(rx),
        sx = Math.sin(rx),
        cy = Math.cos(ry),
        sy = Math.sin(ry),
        cz = Math.cos(rz),
        sz = Math.sin(rz);
      const projected = vertices.map(([x, y, z]) => {
        const y1 = y * cx - z * sx,
          z1 = y * sx + z * cx;
        const x2 = x * cy + z1 * sy,
          z2 = -x * sy + z1 * cy;
        const x3 = x2 * cz - y1 * sz,
          y3 = x2 * sz + y1 * cz;
        const perspective = 8 / (8 + z2);
        return {
          world: [x3, y3, z2],
          x: width * 0.5 + x3 * scale * perspective,
          y: height * 0.49 + y3 * scale * perspective,
        };
      });
      const sorted = faces
        .map((indices) => ({
          indices,
          depth:
            indices.reduce((sum, index) => sum + projected[index].world[2], 0) /
            4,
        }))
        .sort((a, b) => b.depth - a.depth);
      for (const { indices } of sorted) {
        const a = projected[indices[0]],
          b = projected[indices[1]],
          c = projected[indices[2]];
        const normal = normalize(
          cross(subtract(b.world, a.world), subtract(c.world, a.world)),
        );
        const diffuse = Math.abs(
          normal.reduce((sum, value, i) => sum + value * light[i], 0),
        );
        const shine = Math.pow(Math.abs(normal[2]), 14) * 0.22;
        const brightness = 0.22 + diffuse * 0.66 + shine;
        ctx.fillStyle = `rgb(${Math.round(189 * brightness)},${Math.round(236 * brightness)},${Math.round(203 * brightness)})`;
        ctx.strokeStyle = `rgba(189,236,203,${0.08 + diffuse * 0.12})`;
        ctx.lineWidth = 0.45;
        ctx.beginPath();
        indices.forEach((index, i) =>
          i
            ? ctx.lineTo(projected[index].x, projected[index].y)
            : ctx.moveTo(projected[index].x, projected[index].y),
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    function frame(time) {
      raf = 0;
      if (!running || !visible || document.hidden) return;
      if (time - lastTime >= (small ? 1000 / 24 : 1000 / 30)) {
        const dt = Math.min((time - (lastTime || time)) / 1000, 0.07);
        lastTime = time;
        rotation += dt * 0.19;
        currentX += (pointerX - currentX) * 0.08;
        currentY += (pointerY - currentY) * 0.08;
        vertices.forEach((point, i) =>
          point.forEach((value, k) => {
            point[k] += (target[i][k] - value) * 0.09;
          }),
        );
        draw();
      }
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
      if (running && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    }
    canvas.hidden = false;
    document.querySelector(".sculpture-fallback").setAttribute("hidden", "");
    const resize = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    });
    resize.observe(canvas);
    const visibility = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        sync();
      },
      { rootMargin: "80px" },
    );
    visibility.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    stage.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || !running) return;
      const rect = stage.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    });
    stage.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });
    return {
      setRunning(value) {
        running = value;
        sync();
      },
      select(name) {
        target = shapes[name];
        if (!running) {
          vertices.forEach((point, i) =>
            point.forEach((_, k) => {
              point[k] = target[i][k];
            }),
          );
          draw();
        }
      },
    };
  }
  try {
    sculpture = createSculpture(document.querySelector(".sculpture-canvas"));
  } catch {
    document.querySelector(".sculpture-canvas").hidden = true;
    document.querySelector(".sculpture-fallback").removeAttribute("hidden");
  }

  function selectTrack(name) {
    if (!Object.hasOwn(tracks, name)) return;
    stage.dataset.activeTrack = name;
    controls
      .querySelectorAll("button")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.track === name),
        ),
      );
    description.textContent = tracks[name].description;
    caseLink.href = tracks[name].href;
    caseLink.replaceChildren(document.createTextNode(tracks[name].label + " "));
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    caseLink.append(arrow);
    sculpture?.select(name);
  }
  controls.hidden = false;
  document.querySelector(".map-fallback").hidden = true;
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-track]");
    if (button) selectTrack(button.dataset.track);
  });

  const machine = document.querySelector(".story-machine");
  const chapterLabels = {
    product: ["{ }", "Interfaz", "API", "Datos", "01 — Producto"],
    ops: ["↗", "Entrega", "Servicio", "Entorno", "02 — Infraestructura"],
    ai: ["✳", "Modelo", "Contexto", "Revisión", "03 — IA aplicada"],
  };
  function selectChapter(name) {
    const [glyph, first, second, third, caption] = chapterLabels[name];
    machine.dataset.chapter = name;
    [
      ".machine-glyph",
      ".node-one",
      ".node-two",
      ".node-three",
      ".machine-caption",
    ].forEach((selector, i) => {
      machine.querySelector(selector).textContent = [
        glyph,
        first,
        second,
        third,
        caption,
      ][i];
    });
  }
  const chapterElements = document.querySelectorAll(".story-chapter");
  let chapters;
  let chapterResize;
  function observeChapters() {
    chapters?.disconnect();
    // IO percentage margins resolve against width. Use viewport-height pixels for this vertical reading band.
    chapters = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) selectChapter(entry.target.dataset.chapter);
      },
      {
        rootMargin: `-${Math.round(window.innerHeight * 0.25)}px 0px -${Math.round(window.innerHeight * 0.35)}px 0px`,
      },
    );
    chapterElements.forEach((chapter) => chapters.observe(chapter));
  }
  observeChapters();
  window.addEventListener("resize", () => {
    clearTimeout(chapterResize);
    chapterResize = setTimeout(observeChapters, 150);
  });

  function startAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const {gsap,ScrollTrigger}=window;
    gsap.registerPlugin(ScrollTrigger);
    const mobile=window.matchMedia('(max-width:600px)').matches;
    const horizontal=window.matchMedia('(min-width:1100px) and (min-height:760px)').matches;
    animationContext=gsap.context(()=>{
      const intro=gsap.timeline({defaults:{ease:'expo.out'}});
      intro.from('.hero-art',{scale:.55,rotation:25,opacity:0,duration:1.7},0)
        .from('.title-line:first-child>span',{xPercent:-15,clipPath:'inset(0 100% 0 0)',duration:1.1},.12)
        .from('.title-line:last-child>span',{xPercent:15,clipPath:'inset(0 0 0 100%)',duration:1.2},.35)
        .from('.role,.hero-intro,.hero-actions',{opacity:0,y:12,duration:.55,stagger:.08},.55);
      const path=document.querySelector('.hero-path path');
      if(path){const length=path.getTotalLength();gsap.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.8,ease:'power2.inOut'},.1);}
      gsap.to('.page-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:0,end:'max',scrub:.15}});
      const exit=gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1},defaults:{ease:'none'}});
      exit.to('.hero-art',{y:mobile?45:230,rotation:-28,scale:1.2},0)
        .to('.title-line:first-child',{xPercent:mobile?-3:-14},0)
        .to('.title-line:last-child',{xPercent:mobile?3:14},0);
      if(path) exit.to(path,{strokeDashoffset:-path.getTotalLength()*.5},0);
      gsap.to('.machine-ring',{rotationZ:'+=200',stagger:.1,ease:'none',scrollTrigger:{trigger:'.system-story',start:'top 70%',end:'bottom 30%',scrub:1}});
      gsap.to('.machine-core',{rotation:45,ease:'none',scrollTrigger:{trigger:'.system-story',start:'top 70%',end:'bottom 30%',scrub:1}});
      document.querySelectorAll('.story-chapter').forEach(chapter=>{
        gsap.from(chapter.querySelector('h3'),{clipPath:'inset(0 0 100% 0)',duration:.75,ease:'expo.out',scrollTrigger:{trigger:chapter,start:'top 75%'}});
      });
      gsap.fromTo('.kinetic-line',{xPercent:12},{xPercent:-35,ease:'none',scrollTrigger:{trigger:'.kinetic-divider',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.featured-case',start:'top 85%',end:'center center',scrub:1}})
        .from('.frame-back',{x:80,y:-80,rotation:28},0)
        .from('.frame-mid',{x:-50,y:45,rotation:-18},.1)
        .from('.frame-front',{y:130,rotation:-16,scale:.8},.15);
      gsap.from('.diamond',{rotationY:60,rotationZ:20,scale:.65,ease:'none',scrollTrigger:{trigger:'.pds-art',start:'top 90%',end:'bottom 50%',scrub:1}});
      gsap.from('.server-stack>i',{x:-70,y:30,opacity:0,stagger:.12,duration:.6,scrollTrigger:{trigger:'.ops-art',start:'top 80%'}});
      document.querySelectorAll('.project-row').forEach((row,i)=>{
        const art=row.querySelector('.project-art');
        const title=row.querySelector('.project-art-word');
        const sequence=horizontal?null:gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:art,start:'top 90%',end:'bottom 45%',scrub:.7}});
        if(!horizontal&&i===0){
          sequence.from(row.querySelector('.profile-back'),{x:mobile?-35:-140,y:-65,rotation:-32,scale:.85},0)
            .from(row.querySelector('.profile-front'),{x:mobile?35:170,y:100,rotation:28,scale:.75},.08);
        } else if(!horizontal&&i===1){
          sequence.from(row.querySelector('.camera-wall'),{rotationY:35,rotationZ:18,scale:.72},0)
            .from(row.querySelectorAll('.camera-feed'),{x:j=>(j%2===0?-1:1)*(mobile?25:85),y:j=>(j<2?-1:1)*60,opacity:.3,stagger:.04},.1)
            .from(row.querySelectorAll('.camera-feed b'),{scaleY:0,transformOrigin:'center',stagger:.04},.35);
        } else if(!horizontal&&i===2){
          sequence.from(row.querySelector('.commerce-boxes'),{rotation:22,scale:.65,y:90},0);
        } else if(!horizontal) {
          sequence.from(row.querySelector('.phone'),{rotationY:-35,rotationZ:-25,scale:.65,y:75},0)
            .from(row.querySelector('.qr-art'),{opacity:.1,scale:.7},.25)
            .from(row.querySelector('.phone-check'),{scale:0,opacity:0},.55);
        }
        if(title&&!horizontal) gsap.fromTo(title,{xPercent:-12},{xPercent:8,ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'bottom top',scrub:1}});
        if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
          // Pointer affects the artwork container, never the objects used by scroll timelines.
          const tiltX=gsap.quickTo(art,'rotationX',{duration:.6,ease:'power3.out'});
          const tiltY=gsap.quickTo(art,'rotationY',{duration:.6,ease:'power3.out'});
          const move=e=>{const r=art.getBoundingClientRect();tiltX(((e.clientY-r.top)/r.height-.5)*-8);tiltY(((e.clientX-r.left)/r.width-.5)*10);};
          const leave=()=>{tiltX(0);tiltY(0);};
          art.addEventListener('pointermove',move);art.addEventListener('pointerleave',leave);
          pointerCleanups.push(()=>{art.removeEventListener('pointermove',move);art.removeEventListener('pointerleave',leave);});
        }
      });
      if(horizontal){
        const viewport=document.querySelector('.project-viewport');
        const list=viewport.querySelector('.project-list');
        viewport.classList.add('gallery-running');
        const distance=()=>Math.max(0,list.scrollWidth-viewport.clientWidth);
        const rail=gsap.to(list,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger:viewport,start:'top 100px',end:()=>'+='+distance()*1.15,pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1}});
        const galleryControls=viewport.querySelector('.gallery-controls');
        galleryControls.hidden=false;
        const step=delta=>{
          const st=rail.scrollTrigger;
          const next=Math.max(0,Math.min(3,Math.round(st.progress*3)+delta));
          window.scrollTo({top:st.start+(st.end-st.start)*next/3,behavior:'smooth'});
        };
        const next=()=>step(1),previous=()=>step(-1);
        galleryControls.querySelector('.gallery-next').addEventListener('click',next);
        galleryControls.querySelector('.gallery-prev').addEventListener('click',previous);
        pointerCleanups.push(()=>{
          galleryControls.querySelector('.gallery-next').removeEventListener('click',next);
          galleryControls.querySelector('.gallery-prev').removeEventListener('click',previous);
        });
        const rows=[...list.querySelectorAll('.project-row')];
        rows.forEach((row,i)=>{
          const focus=()=>{
            const st=rail.scrollTrigger;
            window.scrollTo({top:st.start+(st.end-st.start)*i/(rows.length-1),behavior:'instant'});
            ScrollTrigger.update();
          };
          row.addEventListener('focusin',focus);
          pointerCleanups.push(()=>row.removeEventListener('focusin',focus));
        });
        // Scroll-driven assembly needs this track's horizontal position, not each row's vertical offset.
        document.querySelectorAll('.project-row').forEach((row,i)=>{
          const art=row.querySelector('.project-art');
          const sequence=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{containerAnimation:rail,trigger:row,start:'left 90%',end:'left 12%',scrub:.6}});
          if(i===0){sequence.from(art.querySelector('.profile-back'),{x:-110,y:-50,rotation:-30},0).from(art.querySelector('.profile-front'),{x:150,y:75,rotation:25},.1);}
          else if(i===1){sequence.from(art.querySelector('.camera-wall'),{rotationY:35,scale:.75},0).from(art.querySelectorAll('.camera-feed'),{x:j=>(j%2===0?-1:1)*60,y:j=>(j<2?-1:1)*40,stagger:.04},.1).from(art.querySelectorAll('.camera-feed b'),{scaleY:.2,stagger:.04},.35);}
          else if(i===2){sequence.from(art.querySelector('.commerce-boxes'),{rotation:22,scale:.65,y:70},0);}
          else{sequence.from(art.querySelector('.phone'),{rotationY:-35,rotationZ:-25,scale:.65},0).from(art.querySelector('.qr-art'),{opacity:.2,scale:.7},.25).from(art.querySelector('.phone-check'),{scale:0},.55);}
        });
      }
      gsap.from('.contact-layout h2',{clipPath:'inset(0 100% 0 0)',duration:.9,ease:'expo.out',scrollTrigger:{trigger:'.contact-section',start:'top 75%'}});
    });
  }

  function updateMotion() {
    motionEnabled = !userPaused && !reducedMotion.matches;
    pointerCleanups.forEach((cleanup) => cleanup());
    pointerCleanups = [];
    document.querySelector('.project-viewport')?.classList.remove('gallery-running');
    const galleryControls=document.querySelector('.gallery-controls');
    if(galleryControls) galleryControls.hidden=true;
    animationContext?.revert();
    animationContext = null;
    document.body.classList.toggle("motion-active", motionEnabled);
    document.body.classList.toggle("motion-paused", !motionEnabled);
    motionButton.setAttribute("aria-pressed", String(!motionEnabled));
    motionButton.setAttribute(
      "aria-label",
      motionEnabled ? "Pausar animaciones" : "Reanudar animaciones",
    );
    motionButton.querySelector(".motion-icon").textContent = motionEnabled
      ? "Ⅱ"
      : "▷";
    motionButton.querySelector(".motion-label").textContent = motionEnabled
      ? "Pausar"
      : "Reanudar";
    sculpture?.setRunning(motionEnabled);
    if (motionEnabled) startAnimations();
  }
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => {
    // A system preference remains authoritative. The user can still change the static sculpture.
    if (reducedMotion.matches) return;
    userPaused = !userPaused;
    updateMotion();
  });
  reducedMotion.addEventListener("change", updateMotion);
  updateMotion();
  window.matchMedia('(min-width:1100px) and (min-height:760px)').addEventListener('change', updateMotion);
  window.matchMedia('(max-width:600px)').addEventListener('change', updateMotion);
  if (reducedMotion.matches) {
    motionButton.setAttribute(
      "aria-label",
      "Movimiento reducido por tu configuración",
    );
    motionButton.querySelector(".motion-label").textContent = "Sin movimiento";
    motionButton.disabled = true;
  }
  reducedMotion.addEventListener("change", () => {
    motionButton.disabled = reducedMotion.matches;
    if (reducedMotion.matches) {
      motionButton.setAttribute(
        "aria-label",
        "Movimiento reducido por tu configuración",
      );
      motionButton.querySelector(".motion-label").textContent =
        "Sin movimiento";
    }
  });
  document.fonts.ready.then(() => window.ScrollTrigger?.refresh());
  document
    .querySelectorAll("details")
    .forEach((details) =>
      details.addEventListener("toggle", () => window.ScrollTrigger?.refresh()),
    );
})();
