import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CustomColors {
  product_name: string;
  category?: string;
  card_bg_color?: string;
  card_text_color?: string;
  modal_bg_color?: string;
  modal_text_color?: string;
}

interface ColorEditorContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean;
  customColors: Map<string, CustomColors>;
  updateColor: (productName: string, category: string | null, field: keyof Omit<CustomColors, 'product_name' | 'category'>, color: string) => void;
  saveColors: () => Promise<void>;
  getProductColors: (productName: string, category: string | null) => CustomColors | undefined;
  pendingChanges: Map<string, CustomColors>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

const ColorEditorContext = createContext<ColorEditorContextType | undefined>(undefined);

const ALLOWED_EMAIL = 'felipehudson05@gmail.com';

export const ColorEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [customColors, setCustomColors] = useState<Map<string, CustomColors>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, CustomColors>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Check if user can edit (specific email only)
  const canEdit = user?.email === ALLOWED_EMAIL;

  // Load custom colors from database
  useEffect(() => {
    const loadColors = async () => {
      const { data, error } = await supabase
        .from('product_custom_colors')
        .select('*');
      
      if (error) {
        console.error('[ColorEditor] Error loading colors:', error);
        return;
      }

      const colorsMap = new Map<string, CustomColors>();
      data?.forEach((color: any) => {
        const key = `${color.product_name}|${color.category || ''}`;
        colorsMap.set(key, {
          product_name: color.product_name,
          category: color.category,
          card_bg_color: color.card_bg_color,
          card_text_color: color.card_text_color,
          modal_bg_color: color.modal_bg_color,
          modal_text_color: color.modal_text_color,
        });
      });
      setCustomColors(colorsMap);
    };

    loadColors();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('color-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'product_custom_colors'
      }, () => {
        loadColors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleEditMode = useCallback(() => {
    if (canEdit) {
      setIsEditMode(prev => !prev);
      if (isEditMode) {
        // Exiting edit mode, clear pending changes
        setPendingChanges(new Map());
      }
    }
  }, [canEdit, isEditMode]);

  const updateColor = useCallback((
    productName: string,
    category: string | null,
    field: keyof Omit<CustomColors, 'product_name' | 'category'>,
    color: string
  ) => {
    const key = `${productName}|${category || ''}`;
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || customColors.get(key) || {
        product_name: productName,
        category: category || undefined,
      };
      
      newMap.set(key, {
        ...existing,
        [field]: color,
      });
      
      return newMap;
    });
  }, [customColors]);

  const getProductColors = useCallback((productName: string, category: string | null): CustomColors | undefined => {
    const key = `${productName}|${category || ''}`;
    // Check pending changes first, then saved colors
    return pendingChanges.get(key) || customColors.get(key);
  }, [customColors, pendingChanges]);

  const saveColors = useCallback(async () => {
    if (pendingChanges.size === 0) return;
    
    setIsSaving(true);
    
    try {
      for (const [key, colors] of pendingChanges.entries()) {
        const { error } = await supabase
          .from('product_custom_colors')
          .upsert({
            product_name: colors.product_name,
            category: colors.category || null,
            card_bg_color: colors.card_bg_color || null,
            card_text_color: colors.card_text_color || null,
            modal_bg_color: colors.modal_bg_color || null,
            modal_text_color: colors.modal_text_color || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'product_name,category'
          });

        if (error) {
          console.error('[ColorEditor] Error saving color:', error);
          throw error;
        }
      }
      
      // Merge pending changes into customColors
      setCustomColors(prev => {
        const newMap = new Map(prev);
        pendingChanges.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });
      
      setPendingChanges(new Map());
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges]);

  const hasUnsavedChanges = pendingChanges.size > 0;

  return (
    <ColorEditorContext.Provider value={{
      isEditMode,
      toggleEditMode,
      canEdit,
      customColors,
      updateColor,
      saveColors,
      getProductColors,
      pendingChanges,
      hasUnsavedChanges,
      isSaving,
    }}>
      {children}
    </ColorEditorContext.Provider>
  );
};

export const useColorEditor = () => {
  const context = useContext(ColorEditorContext);
  if (!context) {
    throw new Error('useColorEditor must be used within a ColorEditorProvider');
  }
  return context;
};
