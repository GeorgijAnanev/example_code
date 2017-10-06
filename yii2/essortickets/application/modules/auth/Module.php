<?php

namespace app\modules\auth;

/**
 * Auth class module
 * @package app\modules\auth
 * @version 1.0
 *
 */
class Module extends \yii\base\Module
{

    /** @var string $controllerNamespace */
    public $controllerNamespace = 'app\modules\auth\controllers';

    /** @var  string $userModelClass */
    public $userModelClass;

    public $enablePasswordRecovery = true;

    public $enableConfirmation = true;

    public $enableRegistration = false;

}