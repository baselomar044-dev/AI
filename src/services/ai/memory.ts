import { MemoryItem, RelationshipPerson } from './types';

// ===== MEMORY MANAGER =====
class MemoryManager {
  private memories: Map<string, MemoryItem> = new Map();
  private relationships: Map<string, RelationshipPerson> = new Map();
  private storageKey = 'tryit_memory_v2';
  private relationshipsKey = 'tryit_relationships_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const items: MemoryItem[] = JSON.parse(stored);
        items.forEach(item => this.memories.set(item.key, item));
      }
      
      const storedRel = localStorage.getItem(this.relationshipsKey);
      if (storedRel) {
        const items: RelationshipPerson[] = JSON.parse(storedRel);
        items.forEach(item => this.relationships.set(item.id, item));
      }
    } catch (e) {
      console.warn('Memory load failed, using empty memory');
    }
  }

  private save() {
    try {
      const items = Array.from(this.memories.values());
      localStorage.setItem(this.storageKey, JSON.stringify(items));
      
      const relations = Array.from(this.relationships.values());
      localStorage.setItem(this.relationshipsKey, JSON.stringify(relations));
    } catch (e) {
      console.warn('Memory save failed');
    }
  }

  remember(key: string, value: string, category: MemoryItem['category']) {
    const item: MemoryItem = {
      key,
      value,
      category,
      timestamp: Date.now(),
    };
    this.memories.set(key, item);
    this.save();
  }

  recall(key: string): string | null {
    return this.memories.get(key)?.value || null;
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }

  addRelationship(person: RelationshipPerson) {
    this.relationships.set(person.id, person);
    this.save();
  }

  getRelationships(): RelationshipPerson[] {
    return Array.from(this.relationships.values());
  }

  getMemoryContext(): string {
    const memories = this.getAllMemories();
    const relationships = this.getRelationships();
    
    if (memories.length === 0 && relationships.length === 0) {
      return '';
    }

    let context = '\n\n[معلومات متذكرها عن المستخدم]:\n';
    
    for (const m of memories.slice(-20)) {
      context += `- ${m.key}: ${m.value}\n`;
    }
    
    if (relationships.length > 0) {
      context += '\n[علاقات المستخدم]:\n';
      for (const r of relationships) {
        context += `- ${r.name}`;
        if (r.nickname) context += ` (${r.nickname})`;
        if (r.birthday) context += ` - عيد ميلاده: ${r.birthday}`;
        context += '\n';
      }
    }
    
    return context;
  }

  extractMemoriesFromChat(userMessage: string) {
    const patterns = [
      { regex: /اسمي\s+(.+?)(?:\s|$|\.)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /my name is\s+(\w+)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /ana\s+(\w+)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /بحب\s+(.+?)(?:\s|$|\.)/i, key: 'حاجة بيحبها', category: 'preference' as const },
      { regex: /i love\s+(.+?)(?:\s|$|\.)/i, key: 'حاجة بيحبها', category: 'preference' as const },
      { regex: /بشتغل\s+(.+?)(?:\s|$|\.)/i, key: 'الشغل', category: 'personal' as const },
      { regex: /i work as\s+(.+?)(?:\s|$|\.)/i, key: 'الشغل', category: 'personal' as const },
      { regex: /عيد ميلادي\s+(.+?)(?:\s|$|\.)/i, key: 'عيد الميلاد', category: 'personal' as const },
      { regex: /my birthday is\s+(.+?)(?:\s|$|\.)/i, key: 'عيد الميلاد', category: 'personal' as const },
    ];

    for (const p of patterns) {
      const match = userMessage.match(p.regex);
      if (match && match[1]) {
        this.remember(p.key, match[1].trim(), p.category);
      }
    }
  }
}

export const memoryManager = new MemoryManager();
