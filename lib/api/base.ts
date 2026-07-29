// Classe de base pour les clients API
export abstract class ApiClient {
  protected baseURL: string;
  
  constructor(endpoint: string) {
    // Utiliser une variable d'environnement avec une valeur par défaut
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.baseURL = `${backendUrl}/${endpoint}`;
  }
  
  protected getAuthToken(): string {
    // ATTENTION: localStorage n'est pas disponible dans les artifacts Claude
    // mais fonctionne dans votre application Next.js
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  }
  
  protected async request<T = any>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = path ? `${this.baseURL}/${path}` : this.baseURL;
    const defaultHeaders: Record<string, string> = {};
    
    // Ajouter le token uniquement s'il existe
    const token = this.getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Si c'est du JSON, ajouter le Content-Type
    if (options.body && typeof options.body === 'string') {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si on ne peut pas parser la réponse d'erreur, on garde le message par défaut
        }
        
        throw new Error(errorMessage);
      }
      
      // Vérifier si la réponse a du contenu
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text() as any;
      }
    } catch (error) {
      throw error;
    }
  }
}
