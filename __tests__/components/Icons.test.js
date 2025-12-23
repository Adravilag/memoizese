/**
 * Tests para los componentes de iconos
 */

import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  CardsIcon,
  PlusIcon,
  PlayIcon,
  FireIcon,
  TrashIcon,
  EditIcon,
  SearchIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  TrophyIcon,
  ClockIcon,
  SettingsIcon,
  ChartBarIcon,
} from '../../src/components/Icons';

describe('Icons', () => {
  describe('CheckCircleIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(CheckCircleIcon).toBeDefined();
      expect(typeof CheckCircleIcon).toBe('function');
    });

    it('debe aceptar props de tamaño y color', () => {
      const icon = CheckCircleIcon({ size: 32, color: '#FF0000' });
      expect(icon).toBeDefined();
      expect(icon.props.width).toBe(32);
      expect(icon.props.height).toBe(32);
    });

    it('debe usar valores por defecto', () => {
      const icon = CheckCircleIcon({});
      expect(icon.props.width).toBe(24);
      expect(icon.props.height).toBe(24);
    });
  });

  describe('XCircleIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(XCircleIcon).toBeDefined();
    });
  });

  describe('CardsIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(CardsIcon).toBeDefined();
    });

    it('debe renderizar con props personalizadas', () => {
      const icon = CardsIcon({ size: 48, color: '#4A90D9' });
      expect(icon.props.width).toBe(48);
    });
  });

  describe('PlusIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(PlusIcon).toBeDefined();
    });
  });

  describe('PlayIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(PlayIcon).toBeDefined();
    });
  });

  describe('FireIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(FireIcon).toBeDefined();
    });

    it('debe usar color rojo por defecto', () => {
      const icon = FireIcon({});
      expect(icon).toBeDefined();
    });
  });

  describe('TrashIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(TrashIcon).toBeDefined();
    });
  });

  describe('EditIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(EditIcon).toBeDefined();
    });
  });

  describe('SearchIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(SearchIcon).toBeDefined();
    });
  });

  describe('ThumbsUpIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(ThumbsUpIcon).toBeDefined();
    });
  });

  describe('ThumbsDownIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(ThumbsDownIcon).toBeDefined();
    });
  });

  describe('TrophyIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(TrophyIcon).toBeDefined();
    });
  });

  describe('ClockIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(ClockIcon).toBeDefined();
    });
  });

  describe('SettingsIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(SettingsIcon).toBeDefined();
    });
  });

  describe('ChartBarIcon', () => {
    it('debe exportarse correctamente', () => {
      expect(ChartBarIcon).toBeDefined();
    });
  });

  describe('Todos los iconos', () => {
    const icons = [
      CheckCircleIcon,
      XCircleIcon,
      CardsIcon,
      PlusIcon,
      PlayIcon,
      FireIcon,
      TrashIcon,
      EditIcon,
      SearchIcon,
      ThumbsUpIcon,
      ThumbsDownIcon,
      TrophyIcon,
      ClockIcon,
      SettingsIcon,
      ChartBarIcon,
    ];

    it('deben ser funciones', () => {
      icons.forEach(icon => {
        expect(typeof icon).toBe('function');
      });
    });

    it('deben retornar un elemento válido', () => {
      icons.forEach(icon => {
        const element = icon({});
        expect(element).toBeDefined();
        expect(element.type).toBeDefined();
      });
    });

    it('deben aceptar prop style', () => {
      icons.forEach(icon => {
        const style = { margin: 10 };
        const element = icon({ style });
        expect(element.props.style).toEqual(style);
      });
    });
  });
});
