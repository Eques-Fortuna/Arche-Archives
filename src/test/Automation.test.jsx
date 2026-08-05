import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';
import AppRoutes from '../routes/AppRoutes';
import { renderWithProviders } from './testUtils';
import { setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';

describe('Arche Archives Ingestion & Automation Pipeline Integration Tests', () => {
  beforeEach(() => {
    removeStoredToken();
    removeStoredUser();
    localStorage.clear();
  });

  test('Phase page /dashboard/phases/1 maps to Phase 1 canonical config', async () => {
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/phases/1'] });

    await waitFor(() => {
      // Config Title for Stage 1: Phase 1: Ingestion & Normalization
      expect(screen.getByText(/Phase 1: Ingestion & Normalization/i)).toBeInTheDocument();
      // Config Description
      expect(screen.getByText(/Gutenberg/i)).toBeInTheDocument();
    });
  });

  test('Batch phase run button calls backend endpoint /api/admin/pipeline/run-phase/1', async () => {
    setStoredToken('mock-operator-token');
    setStoredUser({ name: 'Operator Staff', email: 'operator@arche.com', role: 'operator' });

    renderWithProviders(<AppRoutes />, { initialEntries: ['/dashboard/phases/1'] });

    // Wait for the layout to mount and button to be visible
    await waitFor(() => {
      expect(screen.getByText(/Initiate Phase 1 for Eligible Volumes/i)).toBeInTheDocument();
    });

    const runBatchButton = screen.getByText(/Initiate Phase 1 for Eligible/i);
    await waitFor(() => {
      expect(runBatchButton).not.toBeDisabled();
    });
    fireEvent.click(runBatchButton);

    // Confirm dialog should render
    await waitFor(() => {
      expect(screen.getByText(/Trigger Batch Phase Run/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Trigger Batch/i });
    fireEvent.click(confirmButton);

    // Check that success toast indicating successful run is shown
    await waitFor(() => {
      expect(screen.getByText(/Pipeline batch trigger successfully processed!/i)).toBeInTheDocument();
    });
  });

  test('Frontend source files do not contain direct n8n webhook URLs or internal keys', () => {
    const srcDir = path.resolve(__dirname, '..');
    
    const scanDirectory = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
            scanDirectory(filePath, fileList);
          }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          fileList.push(filePath);
        }
      });
      return fileList;
    };

    const files = scanDirectory(srcDir);
    expect(files.length).toBeGreaterThan(0);

    files.forEach(file => {
      // Skip setup/test files themselves from key scanning if needed
      if (file.includes('setup.js') || file.includes('Automation.test')) {
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');

      // Check n8n webhook indicators
      expect(content).not.toContain('n8n.pm');
      expect(content).not.toContain('hooks.n8n');
      expect(content).not.toContain('n8n.cloud');

      // Check secret keywords exposure
      expect(content).not.toContain('INTERNAL_API_KEY');
      expect(content).not.toContain('AWS_SECRET_ACCESS_KEY');
      expect(content).not.toContain('SPACES_SECRET');

      // Check demo credentials quick-fill
      expect(content).not.toContain('handleQuickFill');
      expect(content).not.toContain('Autofill Credentials');
    });
  });
});
