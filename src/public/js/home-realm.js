// home-realm.js - Page-specific logic for Home Realm

// Simple error notification function
function showError(message) {
  if (window.showNotification) {
    window.showNotification('Error', message, 'error');
  } else {
    alert('Error: ' + message);
  }
}

function resumeRun() {
  fetch('/home-realm/resume-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = data.redirect;
      } else {
        showError(data.error);
      }
    })
    .catch((_error) => {
      showError('Failed to resume run');
    });
}

function startRunWithRealm(realmId) {
  const weaponSelection = document.querySelector(
    '#weapon-options .equipment-option.selected'
  );
  const armorSelection = document.querySelector(
    '#armor-options .equipment-option.selected'
  );

  if (!weaponSelection || !armorSelection) {
    showError('Please select both a weapon and armor');
    return;
  }

  const weapon = weaponSelection.getAttribute('data-equipment');
  const armor = armorSelection.getAttribute('data-equipment');

  fetch('/home-realm/new-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      realmId,
      startingWeapon: weapon,
      startingArmor: armor,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = data.redirect;
      } else {
        showError(data.error);
      }
    })
    .catch((_error) => {
      showError('Failed to start run');
    });
}

function showRealmSelection() {
  const realmSelection = document.getElementById('realm-selection');
  const equipmentSelection = document.getElementById('equipment-selection');

  if (realmSelection) {
    realmSelection.style.display = 'block';
    realmSelection.scrollIntoView({ behavior: 'smooth' });
  }

  if (equipmentSelection) {
    equipmentSelection.style.display = 'none';
  }
}

function startRun() {
  const weaponSelection = document.querySelector(
    '#weapon-options .equipment-option.selected'
  );
  const armorSelection = document.querySelector(
    '#armor-options .equipment-option.selected'
  );

  if (!weaponSelection || !armorSelection) {
    showError('Please select both a weapon and armor');
    return;
  }

  showRealmSelection();
}

function hideEquipmentSelection() {
  const equipmentSelection = document.getElementById('equipment-selection');
  const newRunSection = document.querySelector('.new-run-section');

  if (equipmentSelection) {
    equipmentSelection.style.display = 'none';
  }

  if (newRunSection) {
    newRunSection.style.display = 'block';
  }
}

function showEquipmentSelection() {
  const equipmentSelection = document.getElementById('equipment-selection');
  const newRunSection = document.querySelector('.new-run-section');

  if (equipmentSelection) {
    equipmentSelection.style.display = 'block';
    equipmentSelection.scrollIntoView({ behavior: 'smooth' });
  }

  if (newRunSection) {
    newRunSection.style.display = 'none';
  }
}

function populateEquipmentOptions() {
  const weaponOptions = document.getElementById('weapon-options');
  const armorOptions = document.getElementById('armor-options');

  // Get unlocked upgrades from the server (passed via template)
  const unlockedUpgrades = window.unlockedUpgrades || [];

  // Define available equipment based on unlocks
  const availableWeapons = ['sword']; // Sword is always available
  const availableArmor = ['light']; // Light armor is always available

  // Add unlocked weapons (check for the correct upgrade IDs)
  if (unlockedUpgrades.includes('unlock_dagger'))
    availableWeapons.push('dagger');
  if (unlockedUpgrades.includes('unlock_bow')) availableWeapons.push('bow');
  if (unlockedUpgrades.includes('unlock_staff')) availableWeapons.push('staff');
  if (unlockedUpgrades.includes('unlock_hammer'))
    availableWeapons.push('hammer');

  // Add unlocked armor (check for the correct upgrade IDs)
  if (unlockedUpgrades.includes('unlock_medium_armor'))
    availableArmor.push('medium');
  if (unlockedUpgrades.includes('unlock_heavy_armor'))
    availableArmor.push('heavy');

  if (weaponOptions) {
    let weaponHTML = '';

    const weaponData = {
      sword: {
        name: 'Sword',
        description: 'More accurate, but slightly weaker than other weapons.',
      },
      dagger: {
        name: 'Dagger',
        description:
          'Can be thrown or wielded, but requires precise positioning.',
      },
      bow: {
        name: 'Bow',
        description:
          'Requires distance, but a precise shot can make the difference.',
      },
      staff: {
        name: 'Staff',
        description:
          'Can be used to heal or attack, but requires precise timing.',
      },
      hammer: {
        name: 'Hammer',
        description: 'What it lacks in accuracy it makes up in power.',
      },
    };

    availableWeapons.forEach((weapon) => {
      const data = weaponData[weapon];
      weaponHTML += `
        <div class="equipment-option ${weapon === 'sword' ? 'selected' : ''}" data-equipment="${weapon}">
          <h5>${data.name}</h5>
          <p>${data.description}</p>
        </div>
      `;
    });

    weaponOptions.innerHTML = weaponHTML;

    // Add event listeners for weapon selection
    const weaponOptionsElements =
      weaponOptions.querySelectorAll('.equipment-option');
    weaponOptionsElements.forEach((option) => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        weaponOptionsElements.forEach((opt) =>
          opt.classList.remove('selected')
        );
        // Add selected class to clicked option
        option.classList.add('selected');
      });
    });
  }

  if (armorOptions) {
    let armorHTML = '';

    const armorData = {
      light: {
        name: 'Light Armor',
        description: 'Greater mobility, but no real defense.',
      },
      medium: {
        name: 'Medium Armor',
        description: 'A good balance between mobility and defense.',
      },
      heavy: {
        name: 'Heavy Armor',
        description: 'Not very mobile, but will protect you from most hits.',
      },
    };

    availableArmor.forEach((armor) => {
      const data = armorData[armor];
      armorHTML += `
        <div class="equipment-option ${armor === 'light' ? 'selected' : ''}" data-equipment="${armor}">
          <h5>${data.name}</h5>
          <p>${data.description}</p>
        </div>
      `;
    });

    armorOptions.innerHTML = armorHTML;

    // Add event listeners for armor selection
    const armorOptionsElements =
      armorOptions.querySelectorAll('.equipment-option');
    armorOptionsElements.forEach((option) => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        armorOptionsElements.forEach((opt) => opt.classList.remove('selected'));
        // Add selected class to clicked option
        option.classList.add('selected');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize equipment selection
  populateEquipmentOptions();

  // Start new run button
  const startNewRunBtn = document.getElementById('start-new-run-btn');
  if (startNewRunBtn) {
    startNewRunBtn.addEventListener('click', showEquipmentSelection);
  }

  // Cancel equipment selection
  const cancelEquipmentBtn = document.getElementById('cancel-equipment-btn');
  if (cancelEquipmentBtn) {
    cancelEquipmentBtn.addEventListener('click', hideEquipmentSelection);
  }

  // Confirm equipment and start run
  const confirmEquipmentBtn = document.getElementById('confirm-equipment-btn');
  if (confirmEquipmentBtn) {
    confirmEquipmentBtn.addEventListener('click', startRun);
  }

  // Resume run button
  const resumeBtn = document.getElementById('resume-run-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', resumeRun);
  }

  // Realm selection buttons
  const realmButtons = document.querySelectorAll('.start-realm-btn');
  realmButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const { realmId } = e.target.dataset;
      startRunWithRealm(realmId);
    });
  });
});
