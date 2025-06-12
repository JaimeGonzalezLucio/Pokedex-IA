let model, webcam, labelContainer, maxPredictions;
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const resultado = document.getElementById('result');

const buttonVoice = document.getElementById('voiceButton');

const redButton = document.getElementById('red-button');
const yellowButton = document.getElementById('yellow-button');
const greenButton = document.getElementById('green-button');

const URL = "assets/model/";

async function cargarModelo() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  console.log('Modelo Teachable Machine cargado');
}

async function iniciarCamara() {
  const constraints = {
    video: {
      facingMode: { exact: "environment" } 
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    console.error("No se pudo acceder a la cámara trasera, usando la predeterminada", error);

    const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = fallbackStream;
  }
}

let isIdentifying = false;
async function identifyPokemon() {

  setTimeout(()=>{
    redButton.classList.add('red-button-light')
  },750)

  setTimeout(()=>{
    yellowButton.classList.add('yellow-button-light')
  },1000)

  setTimeout(()=>{
    greenButton.classList.add('green-button-light')
  },1250)

  if (isIdentifying) return; 
  isIdentifying = true;

  const startButton = document.getElementById('startButton');
  startButton.classList.add('disabled');   

  const prediction = await model.predict(video);
  const best = prediction.reduce((a, b) => (a.probability > b.probability ? a : b));
  const nombre = best.className.toLowerCase();

  console.log(prediction);
  console.log(best);  
  console.log(nombre);

  setTimeout(()=>{
    redButton.classList.remove('red-button-light')
  },3250)

  setTimeout(()=>{
    yellowButton.classList.remove('yellow-button-light')
  },3500)

  setTimeout(()=>{
    greenButton.classList.remove('green-button-light')
  },3750)

  if (best.probability > 0.9) {
    consultarPokeAPI(nombre);   

  }else{    
    const mensaje = `No tengo datos, no todos los pokemon han sido identificados`;
    resultado.innerText = mensaje;
    hablar(mensaje);    
    resetWindow(4000)
  }  

}

async function consultarPokeAPI(nombre) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
    const data = await res.json();

    video.style.display='none'

    const imagen = document.getElementById('pokemon-img');
    imagen.src = data.sprites.front_default;
    imagen.style.display = 'block';

    const audio = document.getElementById('pokemon-audio');
    const sonido = data.cries?.latest || data.cries?.legacy;
    if (sonido) {
      audio.src = sonido;
      audio.volume = 0.4;
      audio.play();
    }

    setTimeout(() => {
      const mensaje = `${data.name.toUpperCase()} es un Pokémon tipo ${data.types.map(t => t.type.name).join(', ')}. Peso: ${data.weight / 10} kg.`;
      resultado.innerText = mensaje;
      hablar(mensaje);
    }, 2000);

    resetWindow(7000)

  } catch (error) {
    resultado.innerText = 'Error al consultar PokéAPI';
    reactivarBoton();
  }
}

function reactivarBoton() {
  const startButton = document.getElementById('startButton');
  startButton.classList.remove('disabled');
  startButton.innerText = 'Start';
  isIdentifying = false;
}

function resetWindow(time){
  setTimeout(() => {
    resetScreen();
    reactivarBoton();
  },time)
}

function resetScreen(){  
    const imagen = document.getElementById('pokemon-img');
    if (imagen) imagen.style.display = 'none';    
    if (resultado) resultado.innerText = `Presiona START para identificar el Pokémon`;
    if (video) video.style.display = 'block';  
    buttonVoice.classList.remove('button-voice-animation')
}

function hablar(texto) {  
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = 'es-ES';
  synth.speak(utter);  
  buttonVoice.classList.add('button-voice-animation')
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => console.log('Service Worker registrado:', reg.scope))
    .catch((err) => console.error('Error al registrar SW:', err));
}

cargarModelo();
iniciarCamara();