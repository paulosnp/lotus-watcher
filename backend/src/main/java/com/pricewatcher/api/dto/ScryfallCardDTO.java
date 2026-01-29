package com.pricewatcher.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
// Essa linha diz: "Se vierem campos que eu não declarei aqui, ignore, não dê erro."
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScryfallCardDTO {

    private String id;
    private String name;

    @JsonProperty("set_name") // Mapeia o campo "set_name" do JSON para "setName" do Java
    private String setName;

    // O Scryfall retorna preços dentro de um objeto "prices",
    // então precisamos de uma classe interna ou mapeamento especial.
    // Para simplificar agora, vamos mapear o objeto prices.
    private ScryfallPrices prices;

    @JsonProperty("image_uris")
    private ScryfallImages imageUris;

    // Classes internas para pegar os objetos aninhados do JSON
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScryfallPrices {
        private String usd; // O Scryfall manda como String, depois convertemos
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScryfallImages {
        private String normal; // URL da imagem tamanho normal
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScryfallListResponse {
        private List<ScryfallCardDTO> data;
    }
}