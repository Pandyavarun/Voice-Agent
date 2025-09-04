
import { PipecatClient, PipecatClientOptions, RTVIEvent } from '@pipecat-ai/client-js';
import { WebSocketTransport } from '@pipecat-ai/websocket-transport';

class WebsocketClientApp {
  private pcClient: PipecatClient | null = null;
  private connectBtn: HTMLButtonElement | null = null;
  private disconnectBtn: HTMLButtonElement | null = null;
  private statusSpan: HTMLElement | null = null;
  private statusDot: HTMLElement | null = null;
  private micIndicator: HTMLElement | null = null;
  private micLabel: HTMLElement | null = null;
  private botResponse: HTMLElement | null = null;
  private botAudio: HTMLAudioElement;
  private userSpeaking = false;
  private userSpeakingTimeout: number | null = null;
  private botSpeaking = false;
  private currentAnimation?: number;
  private lastBotFinal = '';

  constructor() {
    console.log('WebsocketClientApp');
    this.botAudio = document.createElement('audio');
    this.botAudio.autoplay = true;
    //this.botAudio.playsInline = true;
    document.body.appendChild(this.botAudio);

    this.setupDOMElements();
    this.setupEventListeners();
  this.applySavedTheme();
  }

  /**
   * Set up references to DOM elements and create necessary media elements
   */
  private setupDOMElements(): void {
    this.connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
    this.disconnectBtn = document.getElementById('disconnect-btn') as HTMLButtonElement;
    this.statusSpan = document.getElementById('connection-status');
    this.statusDot = document.getElementById('status-dot');
    this.micIndicator = document.getElementById('mic-indicator');
    this.micLabel = document.getElementById('mic-label');
    this.botResponse = document.getElementById('bot-response');
  }

  /**
   * Set up event listeners for connect/disconnect buttons
   */
  private setupEventListeners(): void {
    this.connectBtn?.addEventListener('click', () => this.connect());
    this.disconnectBtn?.addEventListener('click', () => this.disconnect());
  document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
  // audio events
  this.botAudio.addEventListener('playing', () => { this.botSpeaking = true; });
  this.botAudio.addEventListener('ended', () => { this.botSpeaking = false; this.clearBargeIn(); });
  this.botAudio.addEventListener('pause', () => { this.botSpeaking = false; this.clearBargeIn(); });
  }

  /**
   * Add a timestamped message to the debug log
   */
  private log(message: string): void { console.log(message); }

  /**
   * Update the connection status display
   */
  private updateStatus(status: string): void {
    if (this.statusSpan) this.statusSpan.textContent = status;
    if (this.statusDot) {
      this.statusDot.classList.remove('status-connected', 'status-error');
      if (status === 'Connected') this.statusDot.classList.add('status-connected');
      else if (status === 'Error') this.statusDot.classList.add('status-error');
    }
    this.log(`Status: ${status}`);
  }

  private setUserSpeaking(active: boolean) {
    if (this.userSpeaking === active) return;
    this.userSpeaking = active;
    if (this.micIndicator) {
      this.micIndicator.classList.toggle('listening', active);
    }
    if (this.micLabel) this.micLabel.textContent = active ? 'Listening...' : 'Idle';
    if (active && this.botSpeaking) {
      this.triggerBargeIn();
    } else if (!active) {
      this.clearBargeIn();
    }
  }

  private scheduleUserStop(delay = 450) {
    if (this.userSpeakingTimeout) window.clearTimeout(this.userSpeakingTimeout);
    this.userSpeakingTimeout = window.setTimeout(() => this.setUserSpeaking(false), delay);
  }

  private triggerBargeIn() {
    const panel = document.querySelector('.response-panel');
    panel?.classList.add('barge-in');
  }
  private clearBargeIn() {
    const panel = document.querySelector('.response-panel');
    panel?.classList.remove('barge-in');
  }

  private toggleTheme() {
    const root = document.documentElement;
    const current = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = current;
    localStorage.setItem('va-theme', current);
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.textContent = current === 'light' ? '☀️' : '🌙';
  }
  private applySavedTheme() {
    const saved = localStorage.getItem('va-theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.textContent = saved === 'light' ? '☀️' : '🌙';
  }

  private animateFinalResponse(text: string) {
    if (!this.botResponse) return;
    const el = this.botResponse;
    const full = text;
    let idx = 0;
    if (this.currentAnimation) cancelAnimationFrame(this.currentAnimation);
    const step = () => {
      idx += Math.max(1, Math.ceil(full.length / 45));
      el.textContent = full.slice(0, idx);
      if (idx < full.length) {
        this.currentAnimation = requestAnimationFrame(step);
      }
    };
    step();
  }

  private setBotStreaming(active: boolean) {
    if (!this.botResponse) return;
    this.botResponse.classList.toggle('bot-streaming', active);
  }

  /**
   * Check for available media tracks and set them up if present
   * This is called when the bot is ready or when the transport state changes to ready
   */
  setupMediaTracks() {
    if (!this.pcClient) return;
    const tracks = this.pcClient.tracks();
    if (tracks.bot?.audio) {
      this.setupAudioTrack(tracks.bot.audio);
    }
  }

  /**
   * Set up listeners for track events (start/stop)
   * This handles new tracks being added during the session
   */
  setupTrackListeners() {
    if (!this.pcClient) return;

    // Listen for new tracks starting
    this.pcClient.on(RTVIEvent.TrackStarted, (track, participant) => {
      // Only handle non-local (bot) tracks
      if (!participant?.local && track.kind === 'audio') {
        this.setupAudioTrack(track);
      }
    });

    // Listen for tracks stopping
    this.pcClient.on(RTVIEvent.TrackStopped, (track, participant) => {
      this.log(
        `Track stopped: ${track.kind} from ${participant?.name || 'unknown'}`
      );
    });
  }

  /**
   * Set up an audio track for playback
   * Handles both initial setup and track updates
   */
  private setupAudioTrack(track: MediaStreamTrack): void {
    this.log('Setting up audio track');
    if (
      this.botAudio.srcObject &&
      'getAudioTracks' in this.botAudio.srcObject
    ) {
      const oldTrack = this.botAudio.srcObject.getAudioTracks()[0];
      if (oldTrack?.id === track.id) return;
    }
    this.botAudio.srcObject = new MediaStream([track]);
  }

  /**
   * Initialize and connect to the bot
   * This sets up the Pipecat client, initializes devices, and establishes the connection
   */
  public async connect(): Promise<void> {
    try {
      const startTime = Date.now();

      //const transport = new DailyTransport();
      const PipecatConfig: PipecatClientOptions = {
        transport: new WebSocketTransport(),
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => {
            this.updateStatus('Connected');
            if (this.connectBtn) this.connectBtn.disabled = true;
            if (this.disconnectBtn) this.disconnectBtn.disabled = false;
          },
          onDisconnected: () => {
            this.updateStatus('Disconnected');
            if (this.connectBtn) this.connectBtn.disabled = false;
            if (this.disconnectBtn) this.disconnectBtn.disabled = true;
            this.log('Client disconnected');
          },
          onBotReady: (data) => {
            this.log(`Bot ready: ${JSON.stringify(data)}`);
            this.setupMediaTracks();
          },
          onUserTranscript: (data) => {
            if (!data.final) {
              this.setUserSpeaking(true);
            } else {
              this.scheduleUserStop();
            }
          },
          onBotTranscript: (data) => {
            if (this.botResponse) {
              if (this.botResponse.classList.contains('bot-response-placeholder')) {
                this.botResponse.classList.remove('bot-response-placeholder');
              }
              const isFinal = (data as any).final === true || (data as any).is_final === true || (data as any).done === true;
              if (isFinal) {
                this.setBotStreaming(false);
                if (data.text !== this.lastBotFinal) {
                  this.lastBotFinal = data.text;
                  this.animateFinalResponse(data.text);
                }
              } else {
                this.setBotStreaming(true);
                this.botResponse.textContent = data.text;
              }
            }
          },
          onMessageError: (error) => console.error('Message error:', error),
          onError: (error) => console.error('Error:', error),
        },
      };
      this.pcClient = new PipecatClient(PipecatConfig);
      // @ts-ignore
      window.pcClient = this.pcClient; // Expose for debugging
      this.setupTrackListeners();

  this.log('Initializing devices...');
      await this.pcClient.initDevices();

  this.log('Connecting to bot...');
      const endpoint = 'http://localhost:7860/connect';
      this.log(`Fetching connect endpoint: ${endpoint}`);
      await this.pcClient.startBotAndConnect({
        endpoint,
      });

      const timeTaken = Date.now() - startTime;
  this.log(`Connection complete, timeTaken: ${timeTaken}`);
    } catch (error) {
  this.log(`Error connecting: ${(error as Error).message}`);
      this.updateStatus('Error');
      // Clean up if there's an error
      if (this.pcClient) {
        try {
          await this.pcClient.disconnect();
        } catch (disconnectError) {
    this.log(`Error during disconnect: ${disconnectError}`);
        }
      } else {
    this.log('Skip disconnect: client was not initialized');
      }
    }
  }

  /**
   * Disconnect from the bot and clean up media resources
   */
  public async disconnect(): Promise<void> {
    if (this.pcClient) {
      try {
        await this.pcClient.disconnect();
        this.pcClient = null;
        if (
          this.botAudio.srcObject &&
          'getAudioTracks' in this.botAudio.srcObject
        ) {
          this.botAudio.srcObject
            .getAudioTracks()
            .forEach((track) => track.stop());
          this.botAudio.srcObject = null;
        }
      } catch (error) {
        this.log(`Error disconnecting: ${(error as Error).message}`);
      }
    }
  }
}

declare global {
  interface Window {
    WebsocketClientApp: typeof WebsocketClientApp;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.WebsocketClientApp = WebsocketClientApp;
  new WebsocketClientApp();
});
