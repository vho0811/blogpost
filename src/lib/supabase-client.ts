import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DesignHistory {
  id?: string;
  design_prompt: string;
  target_file: string;
  generated_code: string;
  applied_at: string;
  success: boolean;
  user_id?: string;
}

export interface DesignTemplate {
  id?: string;
  name: string;
  description: string;
  prompt: string;
  code_structure: string;
  created_at: string;
  user_id?: string;
}

export class DesignDatabase {
  private supabase = supabase;

  // Save design history
  async saveDesignHistory(design: Omit<DesignHistory, 'id' | 'applied_at'>): Promise<DesignHistory | null> {
    try {
      const { data, error } = await this.supabase
        .from('design_history')
        .insert({
          ...design,
          applied_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving design history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving design history:', error);
      return null;
    }
  }

  // Get design history
  async getDesignHistory(limit: number = 10): Promise<DesignHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('design_history')
        .select('*')
        .order('applied_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting design history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting design history:', error);
      return [];
    }
  }

  // Save design template
  async saveDesignTemplate(template: Omit<DesignTemplate, 'id' | 'created_at'>): Promise<DesignTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('design_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving design template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving design template:', error);
      return null;
    }
  }

  // Get design templates
  async getDesignTemplates(): Promise<DesignTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('design_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting design templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting design templates:', error);
      return [];
    }
  }

  // Revert to previous design
  async revertToDesign(designId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('design_history')
        .select('*')
        .eq('id', designId)
        .single();

      if (error || !data) {
        console.error('Error getting design for revert:', error);
        return false;
      }

      // Apply the reverted design
      const success = await this.applyRevertedDesign(data);
      return success;
    } catch (error) {
      console.error('Error reverting design:', error);
      return false;
    }
  }

  private async applyRevertedDesign(design: DesignHistory): Promise<boolean> {
    try {
      // This would apply the reverted design to the file
      // Implementation depends on your file system access
      console.log('Applying reverted design:', design);
    
      return true;
    } catch (error) {
      console.error('Error applying reverted design:', error);
      return false;
    }
  }
}

export const designDatabase = new DesignDatabase(); 