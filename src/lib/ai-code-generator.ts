import { aiService } from './ai-service';

interface PageStructure {
  components: string[];
  layout: string;
  styling: string;
  content: string;
  interactiveElements: string[];
}

interface RedesignRequest {
  designPrompt: string;
  currentStructure: PageStructure;
  targetFile: string;
  includeLayout: boolean;
  includeStyling: boolean;
  includeComponents: boolean;
}

interface GeneratedCode {
  componentCode: string;
  cssClasses: string;
  newStructure: string;
  interactiveFeatures: string[];
}

export class AICodeGenerator {
  private aiService = aiService;

  // Analyze current page structure
  async analyzeCurrentStructure(filePath: string): Promise<PageStructure> {
    try {
      const response = await fetch(`/api/analyze-structure?file=${filePath}`);
      const structure = await response.json();
      return structure;
    } catch (error) {
      console.error('Failed to analyze structure:', error);
      return {
        components: [],
        layout: 'default',
        styling: 'default',
        content: '',
        interactiveElements: []
      };
    }
  }

  // Generate new component code based on design request
  async generateRedesignedComponent(request: RedesignRequest): Promise<GeneratedCode> {
    const prompt = `
You are Claude 3.5 Sonnet, an expert React developer and UI/UX designer with deep knowledge of modern web development. Your task is to completely redesign a React component based on the user's specific request.

CURRENT COMPONENT STRUCTURE:
${JSON.stringify(request.currentStructure, null, 2)}

USER DESIGN REQUEST: "${request.designPrompt}"

REDESIGN REQUIREMENTS:
1. **Content Preservation**: Keep all original content but completely redesign the layout, styling, and visual presentation
2. **Modern React Patterns**: Use the latest React 18+ patterns, hooks, and TypeScript best practices
3. **Advanced Styling**: Implement modern CSS with Tailwind classes, gradients, shadows, animations, and responsive design
4. **Interactive Elements**: Add hover effects, transitions, animations, and interactive features that enhance user experience
5. **Component Architecture**: Restructure the component with better organization, separation of concerns, and reusable patterns
6. **Visual Enhancement**: Transform the visual design to match the user's request while maintaining professional quality
7. **Performance Optimization**: Ensure the redesigned component is performant with proper memoization and optimization
8. **Accessibility**: Include proper ARIA labels, semantic HTML, and accessibility features
9. **Mobile Responsive**: Ensure the design works perfectly on all screen sizes
10. **Modern Aesthetics**: Use contemporary design trends, color schemes, and visual effects

TECHNICAL REQUIREMENTS:
- Use TypeScript with proper type definitions
- Implement React hooks (useState, useEffect, useCallback, useMemo)
- Use Tailwind CSS for styling with custom classes when needed
- Include smooth animations and transitions
- Add proper error boundaries and loading states
- Implement responsive design patterns
- Use modern CSS features (grid, flexbox, custom properties)

GENERATE:
1. **Complete React Component**: Full TypeScript React component with new structure
2. **Enhanced Styling**: Modern CSS classes and visual effects
3. **Interactive Features**: Animations, hover effects, and user interactions
4. **Layout Structure**: New component organization and structure
5. **Visual Elements**: Gradients, shadows, typography, and modern UI elements

Return as JSON with: componentCode, cssClasses, newStructure, interactiveFeatures

IMPORTANT: The user specifically wants "${request.designPrompt}". Make sure the entire redesign reflects this request while maintaining high code quality and modern web standards.
`;

    try {
      const result = await this.aiService.enhanceBlogPostWithCustomPrompt(prompt);
      
      return {
        componentCode: result.content || '',
        cssClasses: result.designSuggestions?.join(' ') || '',
        newStructure: result.title || '',
        interactiveFeatures: result.interactiveElements || []
      };
    } catch (error) {
      console.error('Failed to generate redesigned component:', error);
      throw error;
    }
  }

  // Apply the generated code to the actual file
  async applyCodeChanges(filePath: string, generatedCode: GeneratedCode): Promise<boolean> {
    try {
      const response = await fetch('/api/apply-code-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          generatedCode
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to apply code changes:', error);
      return false;
    }
  }

  // Generate complete page redesign
  async redesignPage(designPrompt: string, targetFile: string): Promise<boolean> {
    try {
      console.log('Starting page redesign for:', targetFile);
      
      // 1. Analyze current structure
      const currentStructure = await this.analyzeCurrentStructure(targetFile);
      console.log('Current structure analyzed:', currentStructure);

      // 2. Generate new component code
      const redesignRequest: RedesignRequest = {
        designPrompt,
        currentStructure,
        targetFile,
        includeLayout: true,
        includeStyling: true,
        includeComponents: true
      };

      const generatedCode = await this.generateRedesignedComponent(redesignRequest);
      console.log('Generated new code:', generatedCode);

      // 3. Apply changes to file
      const success = await this.applyCodeChanges(targetFile, generatedCode);
      
      if (success) {
        console.log('Page redesign completed successfully!');
        return true;
      } else {
        console.error('Failed to apply code changes');
        return false;
      }
    } catch (error) {
      console.error('Page redesign failed:', error);
      return false;
    }
  }

  // Generate theme-specific styling
  async generateThemeStyling(designPrompt: string): Promise<string> {
    const prompt = `
You are Claude 3.5 Sonnet, an expert CSS and design system architect. Generate comprehensive styling for this design request: "${designPrompt}"

ADVANCED STYLING REQUIREMENTS:

1. **Modern CSS Architecture**:
   - Use Tailwind CSS with custom utilities
   - Implement CSS custom properties (variables)
   - Create responsive design systems
   - Use modern CSS features (grid, flexbox, container queries)

2. **Color System**:
   - Create harmonious color palettes
   - Implement gradient systems
   - Add dark/light mode support
   - Use semantic color naming

3. **Typography System**:
   - Implement responsive typography scales
   - Add proper font hierarchies
   - Include variable fonts support
   - Optimize for readability

4. **Interactive Elements**:
   - Smooth hover animations
   - Focus states and accessibility
   - Loading and transition states
   - Micro-interactions

5. **Layout & Spacing**:
   - Consistent spacing system
   - Responsive grid layouts
   - Flexible container systems
   - Modern layout patterns

6. **Visual Effects**:
   - Subtle shadows and depth
   - Glassmorphism effects
   - Gradient overlays
   - Animation systems

7. **Performance Optimization**:
   - Optimized CSS selectors
   - Efficient animations
   - Reduced paint operations
   - Mobile-first approach

8. **Accessibility**:
   - High contrast ratios
   - Focus indicators
   - Screen reader support
   - Keyboard navigation

Return as a comprehensive JSON object with:
- cssClasses: Complete Tailwind CSS class system
- colorScheme: Full color palette with variables
- typography: Typography scale and hierarchy
- animations: Animation keyframes and utilities
- layout: Layout system and grid patterns
- interactive: Interactive states and effects
- responsive: Responsive breakpoint system
- accessibility: Accessibility-focused styles

Make sure the styling perfectly matches the design request: "${designPrompt}"
`;

    try {
      const result = await this.aiService.enhanceBlogPostWithCustomPrompt(prompt);
      return result.content || '';
    } catch (error) {
      console.error('Failed to generate theme styling:', error);
      return '';
    }
  }

  // Create new components based on design request
  async createNewComponents(designPrompt: string): Promise<string[]> {
    const prompt = `
Create new React components for this design request: "${designPrompt}"

Requirements:
1. Modern React components with TypeScript
2. Interactive features and animations
3. Responsive design
4. Accessibility features
5. Performance optimized

Return as JSON array of component code strings.
`;

    try {
      const result = await this.aiService.enhanceBlogPostWithCustomPrompt(prompt);
      return result.interactiveElements || [];
    } catch (error) {
      console.error('Failed to create new components:', error);
      return [];
    }
  }
}

export const aiCodeGenerator = new AICodeGenerator(); 