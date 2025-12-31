import { GoogleGenAI, Type } from "@google/genai";
import { VehicleType, ServiceType } from "../types";
import { MOTO_FIXED_PRICE } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const calculateServicePrice = async (
  vehicleType: VehicleType,
  serviceType: string,
  origin: string, // Novo parametro
  destination: string,
  details: string
): Promise<{ price: number; reasoning: string }> => {
  try {
    const modelId = "gemini-3-flash-preview";
    
    // Check for fixed price logic first (Moto + Urban)
    const isRural = destination.toLowerCase().includes('rural') || 
                   destination.toLowerCase().includes('sítio') || 
                   destination.toLowerCase().includes('fazenda');

    if (vehicleType === VehicleType.MOTO && !isRural && serviceType !== ServiceType.FREIGHT) {
      return {
        price: MOTO_FIXED_PRICE,
        reasoning: "Tarifa fixa urbana para motos."
      };
    }

    const prompt = `
      Você é o calculador de preços do app SAA Drivers em Santo Antônio do Amparo (MG).
      
      Contexto:
      Veículo: ${vehicleType}
      Serviço: ${serviceType}
      Origem (Coleta): ${origin || 'Local Atual'}
      Destino (Entrega): ${destination}
      Detalhes Adicionais: ${details}
      
      Regras de Negócio:
      - Moto Urbana: Fixo R$ 10,00.
      - Moto Rural: R$ 20,00 a R$ 40,00.
      - Carro Urbano: R$ 15,00 a R$ 25,00.
      - Carro Rural/Viagem: Baseado em distância (estime R$ 2,50/km).
      - Van/Frete: R$ 50,00 a R$ 150,00 dependendo do item.

      Retorne um JSON:
      - price (number): Valor sugerido.
      - reasoning (string): Explicação curta (max 10 palavras).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      price: result.price || 20.00,
      reasoning: result.reasoning || "Valor estimado."
    };

  } catch (error) {
    console.error("Erro na estimativa IA:", error);
    return {
      price: 25.00,
      reasoning: "Estimativa padrão (sem conexão)."
    };
  }
};