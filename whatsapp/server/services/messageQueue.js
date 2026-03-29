/**
 * WhatsApp Message Queue
 * Handles failed message retry with exponential backoff
 */

class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = parseInt(process.env.MAX_MESSAGE_RETRIES) || 3;
    this.retryDelays = [5000, 30000, 120000]; // 5s, 30s, 2min
    this.processingDelay = 1000; // 1 second between messages
  }

  /**
   * Add a message to the queue
   */
  async add(chatId, content, options = {}) {
    const message = {
      id: this.generateId(),
      chatId,
      content,
      attempts: 0,
      createdAt: Date.now(),
      lastAttempt: null,
      nextRetry: null,
      status: 'pending',
      type: options.type || 'text', // text, image, document
      options: options.options || {}
    };

    this.queue.push(message);
    console.log(`[MessageQueue] Added message ${message.id} to queue (size: ${this.queue.length})`);

    // Start processing if not already running
    this.process();

    return message.id;
  }

  /**
   * Generate unique message ID
   */
  generateId() {
    return `queued-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Process queue
   */
  async process() {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];

      // Check if message should wait
      if (message.nextRetry && Date.now() < message.nextRetry) {
        // Move to back of queue temporarily
        this.queue.shift();
        this.queue.push(message);
        await this.sleep(this.processingDelay);
        continue;
      }

      // Skip failed messages
      if (message.status === 'failed') {
        this.queue.shift();
        continue;
      }

      try {
        await this.sendMessage(message);
        // Success - remove from queue
        this.queue.shift();
        console.log(`[MessageQueue] Message ${message.id} sent successfully`);
      } catch (error) {
        message.attempts++;
        message.lastAttempt = Date.now();

        if (message.attempts >= this.maxRetries) {
          message.status = 'failed';
          console.error(`[MessageQueue] Message ${message.id} failed after ${this.maxRetries} attempts:`, error.message);
          this.queue.shift();
        } else {
          // Schedule retry with exponential backoff
          const delayIndex = Math.min(message.attempts - 1, this.retryDelays.length - 1);
          const delay = this.retryDelays[delayIndex];
          message.nextRetry = Date.now() + delay;
          console.log(`[MessageQueue] Message ${message.id} retry ${message.attempts}/${this.maxRetries} in ${delay}ms`);
          
          // Move to back of queue
          this.queue.shift();
          this.queue.push(message);
        }
      }

      // Small delay between processing
      await this.sleep(this.processingDelay);
    }

    this.processing = false;
  }

  /**
   * Send message (override this with actual WhatsApp send function)
   */
  async sendMessage(message) {
    // This should be overridden by the actual implementation
    throw new Error('sendMessage not implemented - override in constructor');
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(m => m.status === 'pending').length,
      failed: this.queue.filter(m => m.status === 'failed').length,
      processing: this.processing,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Get failed messages
   */
  getFailedMessages() {
    return this.queue.filter(m => m.status === 'failed');
  }

  /**
   * Retry all failed messages
   */
  retryAll() {
    const failed = this.getFailedMessages();
    for (const msg of failed) {
      msg.status = 'pending';
      msg.attempts = 0;
      msg.nextRetry = null;
    }
    this.process();
    return failed.length;
  }

  /**
   * Clear queue
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`[MessageQueue] Cleared ${count} messages`);
    return count;
  }

  /**
   * Remove message by ID
   */
  remove(messageId) {
    const index = this.queue.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`[MessageQueue] Removed message ${messageId}`);
      return true;
    }
    return false;
  }
}

/**
 * Create message queue with WhatsApp client integration
 */
function createMessageQueue(sendFunction) {
  class WhatsAppMessageQueue extends MessageQueue {
    constructor() {
      super();
      this.sendFn = sendFunction;
    }

    async sendMessage(message) {
      if (!this.sendFn) {
        throw new Error('Send function not configured');
      }
      return await this.sendFn(message.chatId, message.content, message.options);
    }
  }

  return new WhatsAppMessageQueue();
}

export { MessageQueue, createMessageQueue };
export default MessageQueue;
