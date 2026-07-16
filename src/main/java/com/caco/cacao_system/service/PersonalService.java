package com.caco.cacao_system.service;

import com.caco.cacao_system.model.Personal;
import com.caco.cacao_system.repository.PersonalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PersonalService {

    private final PersonalRepository personalRepository;

    public List<Personal> listarTodos() {
        return personalRepository.findAll();
    }

    public Optional<Personal> buscarPorId(Long id) {
        return personalRepository.findById(id);
    }

    public Optional<Personal> buscarPorCedula(String cedula) {
        return personalRepository.findByCedula(cedula);
    }

    public boolean existeCedula(String cedula) {
        return personalRepository.existsByCedula(cedula);
    }

    public List<Personal> buscarPorNombres(String q) {
        return personalRepository.findByNombresContainingIgnoreCase(q);
    }

    public List<Personal> buscarPorApellidos(String q) {
        return personalRepository.findByApellidosContainingIgnoreCase(q);
    }

    public List<Personal> buscarPorCargo(String q) {
        return personalRepository.findByCargoContainingIgnoreCase(q);
    }

    public List<Personal> buscarPorEstado(Boolean activo) {
        return personalRepository.findByActivo(activo);
    }

    public Personal guardar(Personal personal) {
        return personalRepository.save(personal);
    }

    public void eliminar(Long id) {
        personalRepository.deleteById(id);
    }
}
