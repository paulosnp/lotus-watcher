package com.pricewatcher.api.dto;

import lombok.Data;

@Data
public class UpdateProfileDto {
    private String name;
    private String avatar;
    private String password;
    private String confirmPassword;
}
