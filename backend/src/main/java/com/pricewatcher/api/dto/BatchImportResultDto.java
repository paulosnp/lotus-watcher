package com.pricewatcher.api.dto;

import java.util.List;

public class BatchImportResultDto {
    private List<String> added;
    private List<String> notFound;

    public BatchImportResultDto(List<String> added, List<String> notFound) {
        this.added = added;
        this.notFound = notFound;
    }

    public List<String> getAdded() {
        return added;
    }

    public void setAdded(List<String> added) {
        this.added = added;
    }

    public List<String> getNotFound() {
        return notFound;
    }

    public void setNotFound(List<String> notFound) {
        this.notFound = notFound;
    }
}
